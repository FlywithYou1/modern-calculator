



use crate::math::{Calculator, MathError};
use rust_decimal::Decimal;
use std::str::FromStr;


#[derive(Debug, Clone, PartialEq)]
pub enum Token {
    Number(Decimal),
    Identifier(String),
    Operator(Operator),
    LeftParen,
    RightParen,
    Comma,
    EOF,
}


#[derive(Debug, Clone, Copy, PartialEq)]
pub enum Operator {
    Add,
    Subtract,
    Multiply,
    Divide,
    Power,
    Modulo,
    UnaryMinus,
    UnaryPlus,
}

impl Operator {
    pub fn precedence(&self) -> u8 {
        match self {
            Operator::UnaryMinus | Operator::UnaryPlus => 7,
            Operator::Power => 6,
            Operator::Multiply | Operator::Divide | Operator::Modulo => 5,
            Operator::Add | Operator::Subtract => 4,
        }
    }

    pub fn is_right_associative(&self) -> bool {
        matches!(self, Operator::Power | Operator::UnaryMinus | Operator::UnaryPlus)
    }
}


#[derive(Debug, Clone)]
pub enum ASTNode {
    Number(Decimal),
    Identifier(String),
    BinaryOp {
        left: Box<ASTNode>,
        operator: Operator,
        right: Box<ASTNode>,
    },
    UnaryOp {
        operator: Operator,
        operand: Box<ASTNode>,
    },
    FunctionCall {
        name: String,
        args: Vec<ASTNode>,
    },
}


pub struct Lexer {
    input: Vec<char>,
    position: usize,
    current_char: Option<char>,
}

impl Lexer {
    pub fn new(input: &str) -> Self {
        let chars: Vec<char> = input.chars().collect();
        let current_char = chars.get(0).copied();
        Self {
            input: chars,
            position: 0,
            current_char,
        }
    }

    fn advance(&mut self) {
        self.position += 1;
        self.current_char = self.input.get(self.position).copied();
    }

    fn skip_whitespace(&mut self) {
        while let Some(ch) = self.current_char {
            if ch.is_whitespace() {
                self.advance();
            } else {
                break;
            }
        }
    }

    fn read_number(&mut self) -> Result<Decimal, MathError> {
        let mut number_str = String::new();
        while let Some(ch) = self.current_char {
            if ch.is_ascii_digit() || ch == '.' {
                number_str.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        if let Some('e') | Some('E') = self.current_char {
            number_str.push(self.current_char.unwrap());
            self.advance();
            if let Some('+') | Some('-') = self.current_char {
                number_str.push(self.current_char.unwrap());
                self.advance();
            }
            while let Some(ch) = self.current_char {
                if ch.is_ascii_digit() {
                    number_str.push(ch);
                    self.advance();
                } else {
                    break;
                }
            }
        }
        Decimal::from_str(&number_str)
            .map_err(|_| MathError::ParseError(format!("无效的数字: {}", number_str)))
    }

    fn read_identifier(&mut self) -> String {
        let mut identifier = String::new();
        while let Some(ch) = self.current_char {
            if ch.is_alphabetic() || ch.is_ascii_digit() || ch == '_' || ch == 'π' || ch == 'φ' {
                identifier.push(ch);
                self.advance();
            } else {
                break;
            }
        }
        identifier
    }

    pub fn next_token(&mut self) -> Result<Token, MathError> {
        self.skip_whitespace();
        match self.current_char {
            None => Ok(Token::EOF),
            Some('+') => {
                self.advance();
                Ok(Token::Operator(Operator::Add))
            }
            Some('-') => {
                self.advance();
                Ok(Token::Operator(Operator::Subtract))
            }
            Some('*') => {
                self.advance();
                Ok(Token::Operator(Operator::Multiply))
            }
            Some('/') => {
                self.advance();
                Ok(Token::Operator(Operator::Divide))
            }
            Some('^') => {
                self.advance();
                Ok(Token::Operator(Operator::Power))
            }
            Some('%') => {
                self.advance();
                Ok(Token::Operator(Operator::Modulo))
            }
            Some('(') => {
                self.advance();
                Ok(Token::LeftParen)
            }
            Some(')') => {
                self.advance();
                Ok(Token::RightParen)
            }
            Some(',') => {
                self.advance();
                Ok(Token::Comma)
            }
            Some(ch) if ch.is_ascii_digit() || ch == '.' => {
                let number = self.read_number()?;
                Ok(Token::Number(number))
            }
            Some(ch) if ch.is_alphabetic() || ch == 'π' || ch == 'φ' => {
                let identifier = self.read_identifier();
                Ok(Token::Identifier(identifier))
            }
            Some(ch) => {
                Err(MathError::ParseError(format!("意外字符: {}", ch)))
            }
        }
    }
}


pub struct Parser {
    lexer: Lexer,
    current_token: Token,
}

impl Parser {
    pub fn new(mut lexer: Lexer) -> Result<Self, MathError> {
        let current_token = lexer.next_token()?;
        Ok(Self {
            lexer,
            current_token,
        })
    }

    fn advance(&mut self) -> Result<(), MathError> {
        self.current_token = self.lexer.next_token()?;
        Ok(())
    }

    pub fn parse(&mut self) -> Result<ASTNode, MathError> {
        self.parse_expression()
    }

    fn parse_expression(&mut self) -> Result<ASTNode, MathError> {
        self.parse_additive()
    }

    fn parse_additive(&mut self) -> Result<ASTNode, MathError> {
        let mut node = self.parse_multiplicative()?;

        while matches!(self.current_token, Token::Operator(Operator::Add | Operator::Subtract)) {
            let operator = match self.current_token {
                Token::Operator(op) => op,
                _ => unreachable!(),
            };
            self.advance()?;
            node = ASTNode::BinaryOp {
                left: Box::new(node),
                operator,
                right: Box::new(self.parse_multiplicative()?),
            };
        }

        Ok(node)
    }

    fn parse_multiplicative(&mut self) -> Result<ASTNode, MathError> {
        let mut node = self.parse_power()?;

        while matches!(self.current_token, Token::Operator(Operator::Multiply | Operator::Divide | Operator::Modulo)) {
            let operator = match self.current_token {
                Token::Operator(op) => op,
                _ => unreachable!(),
            };
            self.advance()?;
            node = ASTNode::BinaryOp {
                left: Box::new(node),
                operator,
                right: Box::new(self.parse_power()?),
            };
        }

        Ok(node)
    }

    fn parse_power(&mut self) -> Result<ASTNode, MathError> {
        let mut node = self.parse_unary()?;

        if matches!(self.current_token, Token::Operator(Operator::Power)) {
            let operator = Operator::Power;
            self.advance()?;
            node = ASTNode::BinaryOp {
                left: Box::new(node),
                operator,
                right: Box::new(self.parse_power()?), 
            };
        }

        Ok(node)
    }

    fn parse_unary(&mut self) -> Result<ASTNode, MathError> {
        match &self.current_token {
            Token::Operator(Operator::Add) => {
                self.advance()?;
                Ok(ASTNode::UnaryOp {
                    operator: Operator::UnaryPlus,
                    operand: Box::new(self.parse_unary()?),
                })
            }
            Token::Operator(Operator::Subtract) => {
                self.advance()?;
                Ok(ASTNode::UnaryOp {
                    operator: Operator::UnaryMinus,
                    operand: Box::new(self.parse_unary()?),
                })
            }
            _ => self.parse_primary(),
        }
    }

    fn parse_primary(&mut self) -> Result<ASTNode, MathError> {
        match &self.current_token.clone() {
            Token::Number(n) => {
                let number = *n;
                self.advance()?;
                Ok(ASTNode::Number(number))
            }
            Token::LeftParen => {
                self.advance()?;
                let node = self.parse_expression()?;
                if !matches!(self.current_token, Token::RightParen) {
                    return Err(MathError::ParseError("期望 ')'".to_string()));
                }
                self.advance()?;
                Ok(node)
            }
            Token::Identifier(name) => {
                let identifier = name.clone();
                self.advance()?;
                if matches!(self.current_token, Token::LeftParen) {
                    self.advance()?; 
                    let mut args = Vec::new();
                    if !matches!(self.current_token, Token::RightParen) {
                        loop {
                            args.push(self.parse_expression()?);
                            if matches!(self.current_token, Token::Comma) {
                                self.advance()?; 
                            } else {
                                break;
                            }
                        }
                    }
                    if !matches!(self.current_token, Token::RightParen) {
                        return Err(MathError::ParseError("期望 ')'".to_string()));
                    }
                    self.advance()?; 
                    Ok(ASTNode::FunctionCall {
                        name: identifier,
                        args,
                    })
                } else {
                    Ok(ASTNode::Identifier(identifier))
                }
            }
            _ => Err(MathError::ParseError(format!("意外的标记: {:?}", self.current_token))),
        }
    }
}


pub struct ExpressionParser;

impl ExpressionParser {
    pub fn new() -> Self {
        Self
    }

    pub fn parse(&self, expression: &str) -> Result<ASTNode, MathError> {
        let lexer = Lexer::new(expression);
        let mut parser = Parser::new(lexer)?;
        parser.parse()
    }
}


pub struct Evaluator<'a> {
    calculator: &'a Calculator,
}

impl<'a> Evaluator<'a> {
    pub fn new(calculator: &'a Calculator) -> Self {
        Self { calculator }
    }

    pub fn evaluate<'b>(&'b self, node: &'b ASTNode) -> std::pin::Pin<Box<dyn std::future::Future<Output = Result<Decimal, MathError>> + Send + 'b>> {
        Box::pin(async move {
            match node {
                ASTNode::Number(n) => Ok(*n),
                ASTNode::Identifier(name) => {
                    if let Some(value) = self.calculator.constants.get(name) {
                        Ok(*value)
                    } else {
                        Err(MathError::ParseError(format!("未知标识符: {}", name)))
                    }
                }
                ASTNode::BinaryOp { left, operator, right } => {
                    let left_val = self.evaluate(left).await?;
                    let right_val = self.evaluate(right).await?;
                    match operator {
                        Operator::Add => self.calculator.add(left_val, right_val),
                        Operator::Subtract => self.calculator.subtract(left_val, right_val),
                        Operator::Multiply => self.calculator.multiply(left_val, right_val),
                        Operator::Divide => self.calculator.divide(left_val, right_val),
                        Operator::Power => self.calculator.power(left_val, right_val),
                        Operator::Modulo => {
                            if right_val.is_zero() {
                                return Err(MathError::DivisionByZero);
                            }
                            Ok(left_val % right_val)
                        }
                        _ => Err(MathError::InvalidOperation(format!("无效的二元运算符: {:?}", operator))),
                    }
                }
                ASTNode::UnaryOp { operator, operand } => {
                    let operand_val = self.evaluate(operand).await?;
                    match operator {
                        Operator::UnaryPlus => Ok(operand_val),
                        Operator::UnaryMinus => Ok(-operand_val),
                        _ => Err(MathError::InvalidOperation(format!("无效的一元运算符: {:?}", operator))),
                    }
                }
                ASTNode::FunctionCall { name, args } => {
                    self.evaluate_function(name, args).await
                }
            }
        })
    }

    async fn evaluate_function(&self, name: &str, args: &[ASTNode]) -> Result<Decimal, MathError> {
        let mut evaluated_args = Vec::new();
        for arg in args {
            evaluated_args.push(self.evaluate(arg).await?);
        }

        match name {
            "sin" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("sin 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.sin(evaluated_args[0])
            }
            "cos" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("cos 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.cos(evaluated_args[0])
            }
            "tan" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("tan 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.tan(evaluated_args[0])
            }
            "asin" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("asin 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.asin(evaluated_args[0])
            }
            "sqrt" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("sqrt 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.sqrt(evaluated_args[0])
            }
            "cbrt" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("cbrt 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.cbrt(evaluated_args[0])
            }
            "ln" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("ln 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.ln(evaluated_args[0])
            }
            "log10" | "log" => {
                if evaluated_args.len() == 1 {
                    self.calculator.log10(evaluated_args[0])
                } else if evaluated_args.len() == 2 {
                    self.calculator.log(evaluated_args[0], evaluated_args[1])
                } else {
                    Err(MathError::InvalidFunction(format!("log 函数需要 1 或 2 个参数，但提供了 {}", evaluated_args.len())))
                }
            }
            "exp" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("exp 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.exp(evaluated_args[0])
            }
            "factorial" | "fact" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("factorial 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.factorial(evaluated_args[0])
            }
            "pow" => {
                if evaluated_args.len() != 2 {
                    return Err(MathError::InvalidFunction(format!("pow 函数需要 2 个参数，但提供了 {}", evaluated_args.len())));
                }
                self.calculator.power(evaluated_args[0], evaluated_args[1])
            }
            "bin" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("bin 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                let result = self.calculator.to_base(evaluated_args[0], 2)?;
                Err(MathError::InvalidFunction(format!("二进制: {}", result)))
            }
            "oct" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("oct 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                let result = self.calculator.to_base(evaluated_args[0], 8)?;
                Err(MathError::InvalidFunction(format!("八进制: {}", result)))
            }
            "hex" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction(format!("hex 函数需要 1 个参数，但提供了 {}", evaluated_args.len())));
                }
                let result = self.calculator.to_base(evaluated_args[0], 16)?;
                Err(MathError::InvalidFunction(format!("十六进制: {}", result)))
            }
            "mean" | "avg" => {
                if evaluated_args.is_empty() {
                    return Err(MathError::InvalidFunction("mean 函数至少需要 1 个参数".to_string()));
                }
                self.calculator.mean(&evaluated_args)
            }
            "median" => {
                if evaluated_args.is_empty() {
                    return Err(MathError::InvalidFunction("median 函数至少需要 1 个参数".to_string()));
                }
                self.calculator.median(&evaluated_args)
            }
            "variance" | "var" => {
                if evaluated_args.len() < 2 {
                    return Err(MathError::InvalidFunction("variance 函数至少需要 2 个参数".to_string()));
                }
                self.calculator.variance(&evaluated_args)
            }
            "stdev" | "std" => {
                if evaluated_args.len() < 2 {
                    return Err(MathError::InvalidFunction("stdev 函数至少需要 2 个参数".to_string()));
                }
                self.calculator.standard_deviation(&evaluated_args)
            }
            "min" => {
                if evaluated_args.is_empty() {
                    return Err(MathError::InvalidFunction("min 函数至少需要 1 个参数".to_string()));
                }
                self.calculator.min(&evaluated_args)
            }
            "max" => {
                if evaluated_args.is_empty() {
                    return Err(MathError::InvalidFunction("max 函数至少需要 1 个参数".to_string()));
                }
                self.calculator.max(&evaluated_args)
            }
            "sum" => {
                if evaluated_args.is_empty() {
                    return Err(MathError::InvalidFunction("sum 函数至少需要 1 个参数".to_string()));
                }
                self.calculator.sum(&evaluated_args)
            }
            "product" => {
                if evaluated_args.is_empty() {
                    return Err(MathError::InvalidFunction("product 函数至少需要 1 个参数".to_string()));
                }
                self.calculator.product(&evaluated_args)
            }
            "perm" | "P" => {
                if evaluated_args.len() != 2 {
                    return Err(MathError::InvalidFunction("perm 函数需要 2 个参数".to_string()));
                }
                self.calculator.permutation(evaluated_args[0], evaluated_args[1])
            }
            "comb" | "C" => {
                if evaluated_args.len() != 2 {
                    return Err(MathError::InvalidFunction("comb 函数需要 2 个参数".to_string()));
                }
                self.calculator.combination(evaluated_args[0], evaluated_args[1])
            }
            "gcd" => {
                if evaluated_args.len() != 2 {
                    return Err(MathError::InvalidFunction("gcd 函数需要 2 个参数".to_string()));
                }
                self.calculator.gcd(evaluated_args[0], evaluated_args[1])
            }
            "lcm" => {
                if evaluated_args.len() != 2 {
                    return Err(MathError::InvalidFunction("lcm 函数需要 2 个参数".to_string()));
                }
                self.calculator.lcm(evaluated_args[0], evaluated_args[1])
            }
            "sinh" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction("sinh 函数需要 1 个参数".to_string()));
                }
                self.calculator.sinh(evaluated_args[0])
            }
            "cosh" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction("cosh 函数需要 1 个参数".to_string()));
                }
                self.calculator.cosh(evaluated_args[0])
            }
            "tanh" => {
                if evaluated_args.len() != 1 {
                    return Err(MathError::InvalidFunction("tanh 函数需要 1 个参数".to_string()));
                }
                self.calculator.tanh(evaluated_args[0])
            }
            _ => Err(MathError::InvalidFunction(format!("未知函数: {}", name))),
        }
    }
}


pub async fn parse_and_evaluate(expression: &str, calculator: &Calculator) -> Result<Decimal, MathError> {
    #[cfg(debug_assertions)]
    let parse_start = std::time::Instant::now();
    let parser = ExpressionParser::new();
    let ast = parser.parse(expression)?;
    #[cfg(debug_assertions)]
    {
        let parse_time = parse_start.elapsed().as_millis() as f64;
        let debugger = crate::mcp::get_mcp_debugger();
        debugger.track_expression_parsing(expression, &ast, parse_time);
    }
    let evaluator = Evaluator::new(calculator);
    evaluator.evaluate(&ast).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use crate::math::Calculator;
    use rust_decimal::prelude::ToPrimitive;

    #[tokio::test]
    async fn test_basic_expressions() {
        let calc = Calculator::default();
        assert_eq!(
            parse_and_evaluate("2 + 3 * 4", &calc).await.unwrap(),
            Decimal::from(14)
        );
        assert_eq!(
            parse_and_evaluate("(2 + 3) * 4", &calc).await.unwrap(),
            Decimal::from(20)
        );
        assert_eq!(
            parse_and_evaluate("2 ^ 3 ^ 2", &calc).await.unwrap(),
            Decimal::from(512) 
        );
    }

    #[tokio::test]
    async fn test_function_calls() {
        let calc = Calculator::default();
        let result = parse_and_evaluate("sqrt(16)", &calc).await.unwrap();
        assert_eq!(result, Decimal::from(4));
        let result = parse_and_evaluate("factorial(5)", &calc).await.unwrap();
        assert_eq!(result, Decimal::from(120));
    }

    #[tokio::test]
    async fn test_constants() {
        let calc = Calculator::default();
        let result = parse_and_evaluate("π", &calc).await.unwrap();
        assert!((result.to_f64().unwrap() - std::f64::consts::PI).abs() < 0.0001);
        let result = parse_and_evaluate("e", &calc).await.unwrap();
        assert!((result.to_f64().unwrap() - std::f64::consts::E).abs() < 0.0001);
    }

    #[tokio::test]
    async fn test_unary_operators() {
        let calc = Calculator::default();
        assert_eq!(
            parse_and_evaluate("-5", &calc).await.unwrap(),
            Decimal::from(-5)
        );
        assert_eq!(
            parse_and_evaluate("+5", &calc).await.unwrap(),
            Decimal::from(5)
        );
        assert_eq!(
            parse_and_evaluate("-(2 + 3)", &calc).await.unwrap(),
            Decimal::from(-5)
        );
    }
}