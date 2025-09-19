//! 高精度数学计算模块
//! 
//! 提供金融级别的数学计算精度，支持基础运算、科学计算、统计分析等功能

use rust_decimal::{Decimal, MathematicalOps, prelude::*};
use num_complex::Complex;
use std::collections::HashMap;
use thiserror::Error;

/// 数学常数
pub struct MathConstants;

impl MathConstants {
    pub const PI: &'static str = "3.141592653589793238462643383279";
    pub const E: &'static str = "2.718281828459045235360287471353";
    pub const PHI: &'static str = "1.618033988749894848204586834366"; // 黄金比例
    pub const SQRT_2: &'static str = "1.414213562373095048801688724210";
    pub const SQRT_3: &'static str = "1.732050807568877293527446341506";
    pub const LN_2: &'static str = "0.693147180559945309417232121458";
    pub const LN_10: &'static str = "2.302585092994045684017991454684";
    pub const LOG10_E: &'static str = "0.434294481903251827651128918917";
}

/// 矩阵数据结构
#[derive(Debug, Clone, PartialEq)]
pub struct Matrix {
    rows: usize,
    cols: usize,
    data: Vec<Vec<Decimal>>,
}

impl Matrix {
    /// 创建新矩阵
    pub fn new(rows: usize, cols: usize) -> Self {
        Self {
            rows,
            cols,
            data: vec![vec![Decimal::ZERO; cols]; rows],
        }
    }

    /// 从二维向量创建矩阵
    pub fn from_vec(data: Vec<Vec<Decimal>>) -> Result<Self, MathError> {
        if data.is_empty() {
            return Err(MathError::InvalidOperation("矩阵不能为空".to_string()));
        }
        
        let rows = data.len();
        let cols = data[0].len();
        
        // 检查所有行的列数是否相同
        for row in &data {
            if row.len() != cols {
                return Err(MathError::InvalidOperation("矩阵各行列数必须相同".to_string()));
            }
        }
        
        Ok(Self { rows, cols, data })
    }

    /// 创建单位矩阵
    pub fn identity(size: usize) -> Self {
        let mut matrix = Self::new(size, size);
        for i in 0..size {
            matrix.data[i][i] = Decimal::ONE;
        }
        matrix
    }

    /// 获取矩阵元素
    pub fn get(&self, row: usize, col: usize) -> Result<Decimal, MathError> {
        if row >= self.rows || col >= self.cols {
            return Err(MathError::InvalidOperation("矩阵索引越界".to_string()));
        }
        Ok(self.data[row][col])
    }

    /// 设置矩阵元素
    pub fn set(&mut self, row: usize, col: usize, value: Decimal) -> Result<(), MathError> {
        if row >= self.rows || col >= self.cols {
            return Err(MathError::InvalidOperation("矩阵索引越界".to_string()));
        }
        self.data[row][col] = value;
        Ok(())
    }

    /// 获取矩阵维度
    pub fn dimensions(&self) -> (usize, usize) {
        (self.rows, self.cols)
    }

    /// 矩阵转置
    pub fn transpose(&self) -> Self {
        let mut result = Matrix::new(self.cols, self.rows);
        for i in 0..self.rows {
            for j in 0..self.cols {
                result.data[j][i] = self.data[i][j];
            }
        }
        result
    }

    /// 矩阵加法
    pub fn add(&self, other: &Matrix) -> Result<Matrix, MathError> {
        if self.rows != other.rows || self.cols != other.cols {
            return Err(MathError::InvalidOperation("矩阵维度不匹配".to_string()));
        }

        let mut result = Matrix::new(self.rows, self.cols);
        for i in 0..self.rows {
            for j in 0..self.cols {
                result.data[i][j] = self.data[i][j] + other.data[i][j];
            }
        }
        Ok(result)
    }

    /// 矩阵减法
    pub fn subtract(&self, other: &Matrix) -> Result<Matrix, MathError> {
        if self.rows != other.rows || self.cols != other.cols {
            return Err(MathError::InvalidOperation("矩阵维度不匹配".to_string()));
        }

        let mut result = Matrix::new(self.rows, self.cols);
        for i in 0..self.rows {
            for j in 0..self.cols {
                result.data[i][j] = self.data[i][j] - other.data[i][j];
            }
        }
        Ok(result)
    }

    /// 矩阵乘法
    pub fn multiply(&self, other: &Matrix) -> Result<Matrix, MathError> {
        if self.cols != other.rows {
            return Err(MathError::InvalidOperation("矩阵维度不匹配，无法相乘".to_string()));
        }

        let mut result = Matrix::new(self.rows, other.cols);
        for i in 0..self.rows {
            for j in 0..other.cols {
                let mut sum = Decimal::ZERO;
                for k in 0..self.cols {
                    sum += self.data[i][k] * other.data[k][j];
                }
                result.data[i][j] = sum;
            }
        }
        Ok(result)
    }

    /// 标量乘法
    pub fn scalar_multiply(&self, scalar: Decimal) -> Matrix {
        let mut result = Matrix::new(self.rows, self.cols);
        for i in 0..self.rows {
            for j in 0..self.cols {
                result.data[i][j] = self.data[i][j] * scalar;
            }
        }
        result
    }

    /// 计算行列式（仅适用于方阵）
    pub fn determinant(&self) -> Result<Decimal, MathError> {
        if self.rows != self.cols {
            return Err(MathError::InvalidOperation("只有方阵才能计算行列式".to_string()));
        }

        if self.rows == 1 {
            return Ok(self.data[0][0]);
        }

        if self.rows == 2 {
            return Ok(self.data[0][0] * self.data[1][1] - self.data[0][1] * self.data[1][0]);
        }

        // 使用LU分解计算行列式
        let mut matrix = self.clone();
        let mut det = Decimal::ONE;
        let n = self.rows;

        for i in 0..n {
            // 寻找主元
            let mut max_row = i;
            for k in i + 1..n {
                if matrix.data[k][i].abs() > matrix.data[max_row][i].abs() {
                    max_row = k;
                }
            }

            if matrix.data[max_row][i].is_zero() {
                return Ok(Decimal::ZERO);
            }

            if max_row != i {
                matrix.data.swap(i, max_row);
                det = -det;
            }

            det *= matrix.data[i][i];

            // 消元
            for k in i + 1..n {
                if !matrix.data[i][i].is_zero() {
                    let factor = matrix.data[k][i] / matrix.data[i][i];
                    for j in i..n {
                        let val = matrix.data[i][j];
                        matrix.data[k][j] -= factor * val;
                    }
                }
            }
        }

        Ok(det)
    }

    /// 矩阵求逆（高斯-约旦消元法）
    pub fn inverse(&self) -> Result<Matrix, MathError> {
        if self.rows != self.cols {
            return Err(MathError::InvalidOperation("只有方阵才能求逆".to_string()));
        }

        let n = self.rows;
        let mut augmented = Matrix::new(n, 2 * n);

        // 构造增广矩阵 [A|I]
        for i in 0..n {
            for j in 0..n {
                augmented.data[i][j] = self.data[i][j];
                augmented.data[i][j + n] = if i == j { Decimal::ONE } else { Decimal::ZERO };
            }
        }

        // 高斯-约旦消元
        for i in 0..n {
            // 寻找主元
            let mut max_row = i;
            for k in i + 1..n {
                if augmented.data[k][i].abs() > augmented.data[max_row][i].abs() {
                    max_row = k;
                }
            }

            if augmented.data[max_row][i].is_zero() {
                return Err(MathError::InvalidOperation("矩阵不可逆".to_string()));
            }

            if max_row != i {
                augmented.data.swap(i, max_row);
            }

            // 主元归一化
            let pivot = augmented.data[i][i];
            for j in 0..2 * n {
                augmented.data[i][j] /= pivot;
            }

            // 消元
            for k in 0..n {
                if k != i && !augmented.data[k][i].is_zero() {
                    let factor = augmented.data[k][i];
                    for j in 0..2 * n {
                        let val = augmented.data[i][j];
                        augmented.data[k][j] -= factor * val;
                    }
                }
            }
        }

        // 提取逆矩阵
        let mut result = Matrix::new(n, n);
        for i in 0..n {
            for j in 0..n {
                result.data[i][j] = augmented.data[i][j + n];
            }
        }

        Ok(result)
    }
}

/// 数学计算错误类型
#[derive(Error, Debug)]
pub enum MathError {
    #[error("表达式解析错误: {0}")]
    ParseError(String),
    #[error("除零错误")]
    DivisionByZero,
    #[error("数值溢出")]
    Overflow,
    #[error("无效函数: {0}")]
    InvalidFunction(String),
    #[error("无效操作: {0}")]
    InvalidOperation(String),
    #[error("定义域错误: {0}")]
    DomainError(String),
}

/// 高精度计算器
#[derive(Debug, Clone)]
pub struct Calculator {
    precision: u32,
    angle_mode: AngleMode,
    pub constants: HashMap<String, Decimal>,
}

/// 角度模式
#[derive(Debug, Clone, Copy, PartialEq)]
pub enum AngleMode {
    Degrees,
    Radians,
    Gradians,
}

impl Default for Calculator {
    fn default() -> Self {
        let mut constants = HashMap::new();
        
        // 添加数学常数（使用 from_str 而不是 from_str_exact 以避免精度问题）
        constants.insert("π".to_string(), Decimal::from_str(MathConstants::PI).unwrap_or(Decimal::from_str("3.141592653589793").unwrap()));
        constants.insert("pi".to_string(), Decimal::from_str(MathConstants::PI).unwrap_or(Decimal::from_str("3.141592653589793").unwrap()));
        constants.insert("e".to_string(), Decimal::from_str(MathConstants::E).unwrap_or(Decimal::from_str("2.718281828459045").unwrap()));
        constants.insert("φ".to_string(), Decimal::from_str(MathConstants::PHI).unwrap_or(Decimal::from_str("1.618033988749895").unwrap()));
        constants.insert("phi".to_string(), Decimal::from_str(MathConstants::PHI).unwrap_or(Decimal::from_str("1.618033988749895").unwrap()));
        
        Self {
            precision: 28, // Decimal 的默认精度
            angle_mode: AngleMode::Degrees,
            constants,
        }
    }
}

impl Calculator {
    /// 创建新的计算器实例
    pub fn new(precision: u32, angle_mode: AngleMode) -> Self {
        let mut calc = Self::default();
        calc.precision = precision;
        calc.angle_mode = angle_mode;
        calc
    }

    /// 基础四则运算
    pub fn add(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        Ok(a + b)
    }

    pub fn subtract(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        Ok(a - b)
    }

    pub fn multiply(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        Ok(a * b)
    }

    pub fn divide(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        if b.is_zero() {
            return Err(MathError::DivisionByZero);
        }
        Ok(a / b)
    }

    /// 获取常数值
    pub fn get_constant(&self, name: &str) -> Option<Decimal> {
        self.constants.get(name).copied()
    }

    /// 添加或更新常数
    pub fn set_constant(&mut self, name: String, value: Decimal) {
        self.constants.insert(name, value);
    }

    /// 删除常数
    pub fn remove_constant(&mut self, name: &str) -> Option<Decimal> {
        self.constants.remove(name)
    }

    /// 获取所有常数名称
    pub fn get_constant_names(&self) -> Vec<String> {
        self.constants.keys().cloned().collect()
    }

    /// 乘方运算
    pub fn power(&self, base: Decimal, exponent: Decimal) -> Result<Decimal, MathError> {
        if base.is_zero() && exponent.is_sign_negative() {
            return Err(MathError::DivisionByZero);
        }
        
        // 对于整数指数，使用精确计算
        if exponent.fract().is_zero() {
            if let Ok(exp_i64) = exponent.to_string().parse::<i64>() {
                let result = base.powi(exp_i64);
                return Ok(result);
            }
        }
        
        // 对于小数指数，使用浮点近似计算
        let base_f64 = base.to_f64().ok_or(MathError::Overflow)?;
        let exp_f64 = exponent.to_f64().ok_or(MathError::Overflow)?;
        let result_f64 = base_f64.powf(exp_f64);
        
        if result_f64.is_infinite() || result_f64.is_nan() {
            return Err(MathError::Overflow);
        }
        
        Decimal::from_f64(result_f64).ok_or(MathError::Overflow)
    }

    /// 平方根
    pub fn sqrt(&self, x: Decimal) -> Result<Decimal, MathError> {
        if x.is_sign_negative() {
            return Err(MathError::DomainError("负数不能开平方根".to_string()));
        }
        
        x.sqrt().ok_or(MathError::Overflow)
    }

    /// 立方根
    pub fn cbrt(&self, x: Decimal) -> Result<Decimal, MathError> {
        let x_f64 = x.to_f64().ok_or(MathError::Overflow)?;
        let result_f64 = x_f64.cbrt();
        
        Decimal::from_f64(result_f64).ok_or(MathError::Overflow)
    }

    /// 对数运算
    pub fn ln(&self, x: Decimal) -> Result<Decimal, MathError> {
        if x.is_sign_negative() || x.is_zero() {
            return Err(MathError::DomainError("对数的真数必须为正数".to_string()));
        }
        
        // rust_decimal 的 ln 可能会 panic，所以我们使用 f64 转换
        let x_f64 = x.to_f64().ok_or(MathError::Overflow)?;
        let result_f64 = x_f64.ln();
        
        if result_f64.is_infinite() || result_f64.is_nan() {
            return Err(MathError::Overflow);
        }
        
        Decimal::from_f64(result_f64).ok_or(MathError::Overflow)
    }

    pub fn log10(&self, x: Decimal) -> Result<Decimal, MathError> {
        if x.is_sign_negative() || x.is_zero() {
            return Err(MathError::DomainError("对数的真数必须为正数".to_string()));
        }
        
        let x_f64 = x.to_f64().ok_or(MathError::Overflow)?;
        let result_f64 = x_f64.log10();
        
        if result_f64.is_infinite() || result_f64.is_nan() {
            return Err(MathError::Overflow);
        }
        
        Decimal::from_f64(result_f64).ok_or(MathError::Overflow)
    }

    pub fn log(&self, base: Decimal, x: Decimal) -> Result<Decimal, MathError> {
        if x.is_sign_negative() || x.is_zero() {
            return Err(MathError::DomainError("对数的真数必须为正数".to_string()));
        }
        if base.is_sign_negative() || base.is_zero() || base == Decimal::ONE {
            return Err(MathError::DomainError("对数的底数必须为大于0且不等于1的数".to_string()));
        }
        
        let x_f64 = x.to_f64().ok_or(MathError::Overflow)?;
        let base_f64 = base.to_f64().ok_or(MathError::Overflow)?;
        let result_f64 = x_f64.ln() / base_f64.ln();
        
        if result_f64.is_infinite() || result_f64.is_nan() {
            return Err(MathError::Overflow);
        }
        
        Decimal::from_f64(result_f64).ok_or(MathError::Overflow)
    }

    /// 指数函数
    pub fn exp(&self, x: Decimal) -> Result<Decimal, MathError> {
        let x_f64 = x.to_f64().ok_or(MathError::Overflow)?;
        let result_f64 = x_f64.exp();
        
        if result_f64.is_infinite() || result_f64.is_nan() {
            return Err(MathError::Overflow);
        }
        
        Decimal::from_f64(result_f64).ok_or(MathError::Overflow)
    }

    /// 三角函数（需要角度转换）
    fn to_radians(&self, angle: Decimal) -> Decimal {
        match self.angle_mode {
            AngleMode::Degrees => {
                let pi = Decimal::from_str_exact(MathConstants::PI).unwrap();
                angle * pi / Decimal::from(180)
            }
            AngleMode::Radians => angle,
            AngleMode::Gradians => {
                let pi = Decimal::from_str_exact(MathConstants::PI).unwrap();
                angle * pi / Decimal::from(200)
            }
        }
    }

    pub fn sin(&self, x: Decimal) -> Result<Decimal, MathError> {
        let radians = self.to_radians(x);
        let x_f64 = radians.to_f64().ok_or(MathError::Overflow)?;
        let result = x_f64.sin();
        
        Decimal::from_f64(result).ok_or(MathError::Overflow)
    }

    pub fn cos(&self, x: Decimal) -> Result<Decimal, MathError> {
        let radians = self.to_radians(x);
        let x_f64 = radians.to_f64().ok_or(MathError::Overflow)?;
        let result = x_f64.cos();
        
        Decimal::from_f64(result).ok_or(MathError::Overflow)
    }

    pub fn tan(&self, x: Decimal) -> Result<Decimal, MathError> {
        let radians = self.to_radians(x);
        let x_f64 = radians.to_f64().ok_or(MathError::Overflow)?;
        let result = x_f64.tan();
        
        if result.is_infinite() {
            return Err(MathError::DomainError("tan 函数在此处未定义".to_string()));
        }
        
        Decimal::from_f64(result).ok_or(MathError::Overflow)
    }

    /// 反三角函数
    pub fn asin(&self, x: Decimal) -> Result<Decimal, MathError> {
        if x < Decimal::from(-1) || x > Decimal::ONE {
            return Err(MathError::DomainError("asin 的定义域为 [-1, 1]".to_string()));
        }
        
        let x_f64 = x.to_f64().ok_or(MathError::Overflow)?;
        let result = x_f64.asin();
        let result_decimal = Decimal::from_f64(result).ok_or(MathError::Overflow)?;
        
        // 根据角度模式转换结果
        match self.angle_mode {
            AngleMode::Degrees => {
                let pi = Decimal::from_str_exact(MathConstants::PI).unwrap();
                Ok(result_decimal * Decimal::from(180) / pi)
            }
            AngleMode::Radians => Ok(result_decimal),
            AngleMode::Gradians => {
                let pi = Decimal::from_str_exact(MathConstants::PI).unwrap();
                Ok(result_decimal * Decimal::from(200) / pi)
            }
        }
    }

    /// 阶乘
    pub fn factorial(&self, n: Decimal) -> Result<Decimal, MathError> {
        if !n.fract().is_zero() || n.is_sign_negative() {
            return Err(MathError::DomainError("阶乘只能计算非负整数".to_string()));
        }
        
        let n_u32 = n.to_u32().ok_or(MathError::Overflow)?;
        
        if n_u32 > 170 {
            return Err(MathError::Overflow);
        }
        
        let mut result = Decimal::ONE;
        for i in 2..=n_u32 {
            result *= Decimal::from(i);
        }
        
        Ok(result)
    }

    /// 进制转换功能
    /// 将十进制数转换为指定进制的字符串表示
    pub fn to_base(&self, number: Decimal, base: u32) -> Result<String, MathError> {
        if base < 2 || base > 36 {
            return Err(MathError::InvalidOperation("进制必须在2-36之间".to_string()));
        }

        if !number.fract().is_zero() {
            return Err(MathError::InvalidOperation("进制转换只支持整数".to_string()));
        }

        let mut num = number.to_i64().ok_or(MathError::Overflow)?;
        if num == 0 {
            return Ok("0".to_string());
        }

        let is_negative = num < 0;
        if is_negative {
            num = -num;
        }

        let digits = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        let mut result = String::new();

        while num > 0 {
            let remainder = (num % base as i64) as usize;
            result.insert(0, digits.chars().nth(remainder).unwrap());
            num /= base as i64;
        }

        if is_negative {
            result.insert(0, '-');
        }

        Ok(result)
    }

    /// 从指定进制的字符串转换为十进制数
    pub fn from_base(&self, number_str: &str, base: u32) -> Result<Decimal, MathError> {
        if base < 2 || base > 36 {
            return Err(MathError::InvalidOperation("进制必须在2-36之间".to_string()));
        }

        let trimmed = number_str.trim();
        if trimmed.is_empty() {
            return Err(MathError::ParseError("输入不能为空".to_string()));
        }

        let (number_part, is_negative) = if trimmed.starts_with('-') {
            (&trimmed[1..], true)
        } else {
            (trimmed, false)
        };

        let mut result = 0i64;
        let base_i64 = base as i64;

        for ch in number_part.chars() {
            let digit_value = match ch {
                '0'..='9' => (ch as u32 - '0' as u32) as i64,
                'A'..='Z' => (ch as u32 - 'A' as u32 + 10) as i64,
                'a'..='z' => (ch as u32 - 'a' as u32 + 10) as i64,
                _ => return Err(MathError::ParseError(format!("无效字符: {}", ch))),
            };

            if digit_value >= base_i64 {
                return Err(MathError::ParseError(format!("字符 '{}' 在{}进制中无效", ch, base)));
            }

            result = result.checked_mul(base_i64)
                .and_then(|r| r.checked_add(digit_value))
                .ok_or(MathError::Overflow)?;
        }

        if is_negative {
            result = -result;
        }

        Ok(Decimal::from(result))
    }

    /// 位运算：按位与
    pub fn bitwise_and(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() || !b.fract().is_zero() {
            return Err(MathError::InvalidOperation("位运算只支持整数".to_string()));
        }

        let a_i64 = a.to_i64().ok_or(MathError::Overflow)?;
        let b_i64 = b.to_i64().ok_or(MathError::Overflow)?;

        Ok(Decimal::from(a_i64 & b_i64))
    }

    /// 位运算：按位或
    pub fn bitwise_or(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() || !b.fract().is_zero() {
            return Err(MathError::InvalidOperation("位运算只支持整数".to_string()));
        }

        let a_i64 = a.to_i64().ok_or(MathError::Overflow)?;
        let b_i64 = b.to_i64().ok_or(MathError::Overflow)?;

        Ok(Decimal::from(a_i64 | b_i64))
    }

    /// 位运算：按位异或
    pub fn bitwise_xor(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() || !b.fract().is_zero() {
            return Err(MathError::InvalidOperation("位运算只支持整数".to_string()));
        }

        let a_i64 = a.to_i64().ok_or(MathError::Overflow)?;
        let b_i64 = b.to_i64().ok_or(MathError::Overflow)?;

        Ok(Decimal::from(a_i64 ^ b_i64))
    }

    /// 位运算：按位取反
    pub fn bitwise_not(&self, a: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() {
            return Err(MathError::InvalidOperation("位运算只支持整数".to_string()));
        }

        let a_i64 = a.to_i64().ok_or(MathError::Overflow)?;
        Ok(Decimal::from(!a_i64))
    }

    /// 位运算：左移
    pub fn bitwise_shift_left(&self, a: Decimal, bits: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() || !bits.fract().is_zero() {
            return Err(MathError::InvalidOperation("位运算只支持整数".to_string()));
        }

        let a_i64 = a.to_i64().ok_or(MathError::Overflow)?;
        let bits_u32 = bits.to_u32().ok_or(MathError::InvalidOperation("移位数必须为非负整数".to_string()))?;

        if bits_u32 >= 64 {
            return Err(MathError::Overflow);
        }

        Ok(Decimal::from(a_i64.wrapping_shl(bits_u32)))
    }

    /// 位运算：右移
    pub fn bitwise_shift_right(&self, a: Decimal, bits: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() || !bits.fract().is_zero() {
            return Err(MathError::InvalidOperation("位运算只支持整数".to_string()));
        }

        let a_i64 = a.to_i64().ok_or(MathError::Overflow)?;
        let bits_u32 = bits.to_u32().ok_or(MathError::InvalidOperation("移位数必须为非负整数".to_string()))?;

        if bits_u32 >= 64 {
            return Ok(Decimal::from(if a_i64 < 0 { -1 } else { 0 }));
        }

        Ok(Decimal::from(a_i64.wrapping_shr(bits_u32)))
    }

    /// 复数运算：复数加法
    pub fn complex_add(&self, a_real: Decimal, a_imag: Decimal, b_real: Decimal, b_imag: Decimal) -> Result<(Decimal, Decimal), MathError> {
        let a_real_f64 = a_real.to_f64().ok_or(MathError::Overflow)?;
        let a_imag_f64 = a_imag.to_f64().ok_or(MathError::Overflow)?;
        let b_real_f64 = b_real.to_f64().ok_or(MathError::Overflow)?;
        let b_imag_f64 = b_imag.to_f64().ok_or(MathError::Overflow)?;

        let a = Complex::new(a_real_f64, a_imag_f64);
        let b = Complex::new(b_real_f64, b_imag_f64);
        let result = a + b;

        let real = Decimal::from_f64(result.re).ok_or(MathError::Overflow)?;
        let imag = Decimal::from_f64(result.im).ok_or(MathError::Overflow)?;

        Ok((real, imag))
    }

    /// 复数运算：复数减法
    pub fn complex_subtract(&self, a_real: Decimal, a_imag: Decimal, b_real: Decimal, b_imag: Decimal) -> Result<(Decimal, Decimal), MathError> {
        let a_real_f64 = a_real.to_f64().ok_or(MathError::Overflow)?;
        let a_imag_f64 = a_imag.to_f64().ok_or(MathError::Overflow)?;
        let b_real_f64 = b_real.to_f64().ok_or(MathError::Overflow)?;
        let b_imag_f64 = b_imag.to_f64().ok_or(MathError::Overflow)?;

        let a = Complex::new(a_real_f64, a_imag_f64);
        let b = Complex::new(b_real_f64, b_imag_f64);
        let result = a - b;

        let real = Decimal::from_f64(result.re).ok_or(MathError::Overflow)?;
        let imag = Decimal::from_f64(result.im).ok_or(MathError::Overflow)?;

        Ok((real, imag))
    }

    /// 复数运算：复数乘法
    pub fn complex_multiply(&self, a_real: Decimal, a_imag: Decimal, b_real: Decimal, b_imag: Decimal) -> Result<(Decimal, Decimal), MathError> {
        let a_real_f64 = a_real.to_f64().ok_or(MathError::Overflow)?;
        let a_imag_f64 = a_imag.to_f64().ok_or(MathError::Overflow)?;
        let b_real_f64 = b_real.to_f64().ok_or(MathError::Overflow)?;
        let b_imag_f64 = b_imag.to_f64().ok_or(MathError::Overflow)?;

        let a = Complex::new(a_real_f64, a_imag_f64);
        let b = Complex::new(b_real_f64, b_imag_f64);
        let result = a * b;

        let real = Decimal::from_f64(result.re).ok_or(MathError::Overflow)?;
        let imag = Decimal::from_f64(result.im).ok_or(MathError::Overflow)?;

        Ok((real, imag))
    }

    /// 复数运算：复数除法
    pub fn complex_divide(&self, a_real: Decimal, a_imag: Decimal, b_real: Decimal, b_imag: Decimal) -> Result<(Decimal, Decimal), MathError> {
        if b_real.is_zero() && b_imag.is_zero() {
            return Err(MathError::DivisionByZero);
        }

        let a_real_f64 = a_real.to_f64().ok_or(MathError::Overflow)?;
        let a_imag_f64 = a_imag.to_f64().ok_or(MathError::Overflow)?;
        let b_real_f64 = b_real.to_f64().ok_or(MathError::Overflow)?;
        let b_imag_f64 = b_imag.to_f64().ok_or(MathError::Overflow)?;

        let a = Complex::new(a_real_f64, a_imag_f64);
        let b = Complex::new(b_real_f64, b_imag_f64);
        let result = a / b;

        if result.re.is_infinite() || result.re.is_nan() || result.im.is_infinite() || result.im.is_nan() {
            return Err(MathError::Overflow);
        }

        let real = Decimal::from_f64(result.re).ok_or(MathError::Overflow)?;
        let imag = Decimal::from_f64(result.im).ok_or(MathError::Overflow)?;

        Ok((real, imag))
    }

    /// 复数运算：复数的模（绝对值）
    pub fn complex_abs(&self, real: Decimal, imag: Decimal) -> Result<Decimal, MathError> {
        let real_f64 = real.to_f64().ok_or(MathError::Overflow)?;
        let imag_f64 = imag.to_f64().ok_or(MathError::Overflow)?;

        let complex = Complex::new(real_f64, imag_f64);
        let abs_value = complex.norm();

        if abs_value.is_infinite() || abs_value.is_nan() {
            return Err(MathError::Overflow);
        }

        Decimal::from_f64(abs_value).ok_or(MathError::Overflow)
    }

    /// 复数运算：复数的幅角
    pub fn complex_arg(&self, real: Decimal, imag: Decimal) -> Result<Decimal, MathError> {
        let real_f64 = real.to_f64().ok_or(MathError::Overflow)?;
        let imag_f64 = imag.to_f64().ok_or(MathError::Overflow)?;

        let complex = Complex::new(real_f64, imag_f64);
        let arg_value = complex.arg();

        if arg_value.is_infinite() || arg_value.is_nan() {
            return Err(MathError::Overflow);
        }

        let result = Decimal::from_f64(arg_value).ok_or(MathError::Overflow)?;

        // 根据角度模式转换结果
        match self.angle_mode {
            AngleMode::Degrees => {
                let pi = Decimal::from_str_exact(MathConstants::PI).unwrap();
                Ok(result * Decimal::from(180) / pi)
            }
            AngleMode::Radians => Ok(result),
            AngleMode::Gradians => {
                let pi = Decimal::from_str_exact(MathConstants::PI).unwrap();
                Ok(result * Decimal::from(200) / pi)
            }
        }
    }

    /// 统计分析：计算平均值
    pub fn mean(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        let sum = values.iter().fold(Decimal::ZERO, |acc, &val| acc + val);
        Ok(sum / Decimal::from(values.len()))
    }

    /// 统计分析：计算中位数
    pub fn median(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        let mut sorted_values = values.to_vec();
        sorted_values.sort();

        let len = sorted_values.len();
        if len % 2 == 0 {
            let mid1 = sorted_values[len / 2 - 1];
            let mid2 = sorted_values[len / 2];
            Ok((mid1 + mid2) / Decimal::from(2))
        } else {
            Ok(sorted_values[len / 2])
        }
    }

    /// 统计分析：计算方差
    pub fn variance(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.len() < 2 {
            return Err(MathError::InvalidOperation("计算方差至少需要2个数据点".to_string()));
        }

        let mean_val = self.mean(values)?;
        let sum_squared_diffs = values.iter()
            .map(|&val| {
                let diff = val - mean_val;
                diff * diff
            })
            .fold(Decimal::ZERO, |acc, val| acc + val);

        Ok(sum_squared_diffs / Decimal::from(values.len() - 1))
    }

    /// 统计分析：计算标准差
    pub fn standard_deviation(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        let variance = self.variance(values)?;
        self.sqrt(variance)
    }

    /// 统计分析：计算最小值
    pub fn min(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        Ok(*values.iter().min().unwrap())
    }

    /// 统计分析：计算最大值
    pub fn max(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        Ok(*values.iter().max().unwrap())
    }

    /// 统计分析：计算总和
    pub fn sum(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        Ok(values.iter().fold(Decimal::ZERO, |acc, &val| acc + val))
    }

    /// 统计分析：计算总积
    pub fn product(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        Ok(values.iter().fold(Decimal::ONE, |acc, &val| acc * val))
    }

    /// 统计分析：计算范围（最大值-最小值）
    pub fn range(&self, values: &[Decimal]) -> Result<Decimal, MathError> {
        if values.is_empty() {
            return Err(MathError::InvalidOperation("数据集不能为空".to_string()));
        }

        let min_val = self.min(values)?;
        let max_val = self.max(values)?;
        Ok(max_val - min_val)
    }

    /// 矩阵运算：创建矩阵
    pub fn create_matrix(&self, rows: usize, cols: usize, data: Vec<Decimal>) -> Result<Matrix, MathError> {
        if data.len() != rows * cols {
            return Err(MathError::InvalidOperation("数据长度与矩阵维度不匹配".to_string()));
        }

        let mut matrix_data = Vec::new();
        for i in 0..rows {
            let mut row = Vec::new();
            for j in 0..cols {
                row.push(data[i * cols + j]);
            }
            matrix_data.push(row);
        }

        Matrix::from_vec(matrix_data)
    }

    /// 矩阵运算：矩阵加法
    pub fn matrix_add(&self, a: &Matrix, b: &Matrix) -> Result<Matrix, MathError> {
        a.add(b)
    }

    /// 矩阵运算：矩阵减法
    pub fn matrix_subtract(&self, a: &Matrix, b: &Matrix) -> Result<Matrix, MathError> {
        a.subtract(b)
    }

    /// 矩阵运算：矩阵乘法
    pub fn matrix_multiply(&self, a: &Matrix, b: &Matrix) -> Result<Matrix, MathError> {
        a.multiply(b)
    }

    /// 矩阵运算：矩阵转置
    pub fn matrix_transpose(&self, matrix: &Matrix) -> Matrix {
        matrix.transpose()
    }

    /// 矩阵运算：矩阵行列式
    pub fn matrix_determinant(&self, matrix: &Matrix) -> Result<Decimal, MathError> {
        matrix.determinant()
    }

    /// 矩阵运算：矩阵求逆
    pub fn matrix_inverse(&self, matrix: &Matrix) -> Result<Matrix, MathError> {
        matrix.inverse()
    }

    /// 矩阵运算：创建单位矩阵
    pub fn matrix_identity(&self, size: usize) -> Matrix {
        Matrix::identity(size)
    }

    /// 单位转换系统
    pub fn convert_unit(&self, value: Decimal, from_unit: &str, to_unit: &str) -> Result<Decimal, MathError> {
        // 定义单位转换表
        let conversions = self.get_unit_conversions();
        
        let from_category = self.get_unit_category(from_unit)?;
        let to_category = self.get_unit_category(to_unit)?;
        
        if from_category != to_category {
            return Err(MathError::InvalidOperation(format!(
                "无法在不同类别的单位间转换: {} -> {}", from_unit, to_unit
            )));
        }
        
        // 先转换为基本单位，再转换为目标单位
        let base_value = self.to_base_unit(value, from_unit, &conversions)?;
        self.from_base_unit(base_value, to_unit, &conversions)
    }

    fn get_unit_conversions(&self) -> HashMap<&'static str, (Decimal, &'static str, &'static str)> {
        let mut conversions = HashMap::new();
        
        // 长度单位 (基本单位: 米)
        conversions.insert("mm", (Decimal::from_str("0.001").unwrap(), "length", "meter"));
        conversions.insert("cm", (Decimal::from_str("0.01").unwrap(), "length", "meter"));
        conversions.insert("m", (Decimal::ONE, "length", "meter"));
        conversions.insert("km", (Decimal::from(1000), "length", "meter"));
        conversions.insert("in", (Decimal::from_str("0.0254").unwrap(), "length", "meter"));
        conversions.insert("ft", (Decimal::from_str("0.3048").unwrap(), "length", "meter"));
        conversions.insert("yd", (Decimal::from_str("0.9144").unwrap(), "length", "meter"));
        conversions.insert("mi", (Decimal::from_str("1609.344").unwrap(), "length", "meter"));
        
        // 重量单位 (基本单位: 千克)
        conversions.insert("mg", (Decimal::from_str("0.000001").unwrap(), "weight", "kilogram"));
        conversions.insert("g", (Decimal::from_str("0.001").unwrap(), "weight", "kilogram"));
        conversions.insert("kg", (Decimal::ONE, "weight", "kilogram"));
        conversions.insert("t", (Decimal::from(1000), "weight", "kilogram"));
        conversions.insert("oz", (Decimal::from_str("0.0283495").unwrap(), "weight", "kilogram"));
        conversions.insert("lb", (Decimal::from_str("0.453592").unwrap(), "weight", "kilogram"));
        
        // 面积单位 (基本单位: 平方米)
        conversions.insert("mm²", (Decimal::from_str("0.000001").unwrap(), "area", "square_meter"));
        conversions.insert("cm²", (Decimal::from_str("0.0001").unwrap(), "area", "square_meter"));
        conversions.insert("m²", (Decimal::ONE, "area", "square_meter"));
        conversions.insert("km²", (Decimal::from(1000000), "area", "square_meter"));
        conversions.insert("in²", (Decimal::from_str("0.00064516").unwrap(), "area", "square_meter"));
        conversions.insert("ft²", (Decimal::from_str("0.092903").unwrap(), "area", "square_meter"));
        
        // 体积单位 (基本单位: 立方米)
        conversions.insert("ml", (Decimal::from_str("0.000001").unwrap(), "volume", "cubic_meter"));
        conversions.insert("l", (Decimal::from_str("0.001").unwrap(), "volume", "cubic_meter"));
        conversions.insert("m³", (Decimal::ONE, "volume", "cubic_meter"));
        conversions.insert("in³", (Decimal::from_str("0.0000163871").unwrap(), "volume", "cubic_meter"));
        conversions.insert("ft³", (Decimal::from_str("0.0283168").unwrap(), "volume", "cubic_meter"));
        conversions.insert("gal", (Decimal::from_str("0.00378541").unwrap(), "volume", "cubic_meter"));
        
        // 时间单位 (基本单位: 秒)
        conversions.insert("ms", (Decimal::from_str("0.001").unwrap(), "time", "second"));
        conversions.insert("s", (Decimal::ONE, "time", "second"));
        conversions.insert("min", (Decimal::from(60), "time", "second"));
        conversions.insert("h", (Decimal::from(3600), "time", "second"));
        conversions.insert("day", (Decimal::from(86400), "time", "second"));
        conversions.insert("week", (Decimal::from(604800), "time", "second"));
        
        // 能量单位 (基本单位: 焦耳)
        conversions.insert("J", (Decimal::ONE, "energy", "joule"));
        conversions.insert("kJ", (Decimal::from(1000), "energy", "joule"));
        conversions.insert("cal", (Decimal::from_str("4.184").unwrap(), "energy", "joule"));
        conversions.insert("kcal", (Decimal::from_str("4184").unwrap(), "energy", "joule"));
        conversions.insert("kWh", (Decimal::from_str("3600000").unwrap(), "energy", "joule"));
        
        conversions
    }

    fn get_unit_category(&self, unit: &str) -> Result<&'static str, MathError> {
        let conversions = self.get_unit_conversions();
        if let Some((_, category, _)) = conversions.get(unit) {
            Ok(category)
        } else {
            Err(MathError::InvalidOperation(format!("未知单位: {}", unit)))
        }
    }

    fn to_base_unit(&self, value: Decimal, unit: &str, conversions: &HashMap<&'static str, (Decimal, &'static str, &'static str)>) -> Result<Decimal, MathError> {
        if let Some((factor, _, _)) = conversions.get(unit) {
            Ok(value * factor)
        } else {
            Err(MathError::InvalidOperation(format!("未知单位: {}", unit)))
        }
    }

    fn from_base_unit(&self, value: Decimal, unit: &str, conversions: &HashMap<&'static str, (Decimal, &'static str, &'static str)>) -> Result<Decimal, MathError> {
        if let Some((factor, _, _)) = conversions.get(unit) {
            Ok(value / factor)
        } else {
            Err(MathError::InvalidOperation(format!("未知单位: {}", unit)))
        }
    }

    /// 温度转换（特殊处理，因为有偏移量）
    pub fn convert_temperature(&self, value: Decimal, from_unit: &str, to_unit: &str) -> Result<Decimal, MathError> {
        let celsius = match from_unit {
            "C" | "°C" => value,
            "F" | "°F" => (value - Decimal::from(32)) * Decimal::from_str("0.5555555556").unwrap(),
            "K" => value - Decimal::from_str("273.15").unwrap(),
            _ => return Err(MathError::InvalidOperation(format!("未知温度单位: {}", from_unit))),
        };

        match to_unit {
            "C" | "°C" => Ok(celsius),
            "F" | "°F" => Ok(celsius * Decimal::from_str("1.8").unwrap() + Decimal::from(32)),
            "K" => Ok(celsius + Decimal::from_str("273.15").unwrap()),
            _ => Err(MathError::InvalidOperation(format!("未知温度单位: {}", to_unit))),
        }
    }

    /// 组合数学：排列 P(n,r) = n!/(n-r)!
    pub fn permutation(&self, n: Decimal, r: Decimal) -> Result<Decimal, MathError> {
        if !n.fract().is_zero() || !r.fract().is_zero() || n.is_sign_negative() || r.is_sign_negative() {
            return Err(MathError::DomainError("排列只能计算非负整数".to_string()));
        }

        if r > n {
            return Err(MathError::DomainError("r不能大于n".to_string()));
        }

        let n_factorial = self.factorial(n)?;
        let n_minus_r_factorial = self.factorial(n - r)?;
        
        Ok(n_factorial / n_minus_r_factorial)
    }

    /// 组合数学：组合 C(n,r) = n!/(r!(n-r)!)
    pub fn combination(&self, n: Decimal, r: Decimal) -> Result<Decimal, MathError> {
        if !n.fract().is_zero() || !r.fract().is_zero() || n.is_sign_negative() || r.is_sign_negative() {
            return Err(MathError::DomainError("组合只能计算非负整数".to_string()));
        }

        if r > n {
            return Err(MathError::DomainError("r不能大于n".to_string()));
        }

        let n_factorial = self.factorial(n)?;
        let r_factorial = self.factorial(r)?;
        let n_minus_r_factorial = self.factorial(n - r)?;
        
        Ok(n_factorial / (r_factorial * n_minus_r_factorial))
    }

    /// 数论：最大公约数
    pub fn gcd(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        if !a.fract().is_zero() || !b.fract().is_zero() {
            return Err(MathError::InvalidOperation("最大公约数只能计算整数".to_string()));
        }

        let mut a_int = a.abs().to_i64().ok_or(MathError::Overflow)?;
        let mut b_int = b.abs().to_i64().ok_or(MathError::Overflow)?;

        while b_int != 0 {
            let temp = b_int;
            b_int = a_int % b_int;
            a_int = temp;
        }

        Ok(Decimal::from(a_int))
    }

    /// 数论：最小公倍数
    pub fn lcm(&self, a: Decimal, b: Decimal) -> Result<Decimal, MathError> {
        if a.is_zero() || b.is_zero() {
            return Ok(Decimal::ZERO);
        }

        let gcd_result = self.gcd(a, b)?;
        Ok((a.abs() * b.abs()) / gcd_result)
    }

    /// 进阶函数：双曲函数
    pub fn sinh(&self, x: Decimal) -> Result<Decimal, MathError> {
        let exp_x = self.exp(x)?;
        let exp_neg_x = self.exp(-x)?;
        Ok((exp_x - exp_neg_x) / Decimal::from(2))
    }

    pub fn cosh(&self, x: Decimal) -> Result<Decimal, MathError> {
        let exp_x = self.exp(x)?;
        let exp_neg_x = self.exp(-x)?;
        Ok((exp_x + exp_neg_x) / Decimal::from(2))
    }

    pub fn tanh(&self, x: Decimal) -> Result<Decimal, MathError> {
        let sinh_x = self.sinh(x)?;
        let cosh_x = self.cosh(x)?;
        
        if cosh_x.is_zero() {
            return Err(MathError::DomainError("tanh函数分母为零".to_string()));
        }
        
        Ok(sinh_x / cosh_x)
    }

    /// 百分比计算
    pub fn percentage(&self, value: Decimal, percentage: Decimal) -> Result<Decimal, MathError> {
        Ok(value * percentage / Decimal::from(100))
    }

    /// 百分比增长
    pub fn percentage_increase(&self, original: Decimal, new: Decimal) -> Result<Decimal, MathError> {
        if original.is_zero() {
            return Err(MathError::DivisionByZero);
        }
        Ok(((new - original) / original) * Decimal::from(100))
    }

    /// 主要的表达式计算方法，供解析器使用
    pub fn evaluate(&self, _expression: &crate::parser::ASTNode) -> Result<Decimal, MathError> {
        // 这里应该基于解析后的表达式进行求值
        // 目前作为占位符返回简单结果
        Ok(Decimal::from(42))
    }

    /// 设置角度模式
    pub fn set_angle_mode(&mut self, mode: AngleMode) {
        self.angle_mode = mode;
    }

    /// 获取角度模式
    pub fn get_angle_mode(&self) -> AngleMode {
        self.angle_mode
    }
}

/// 主要的表达式计算入口
pub async fn evaluate(expression: &str) -> Result<Decimal, MathError> {
    let calculator = Calculator::default();
    
    // 简单的表达式解析和计算
    // 在真实实现中，这里会有一个完整的表达式解析器
    crate::parser::parse_and_evaluate(expression, &calculator).await
}

#[cfg(test)]
mod tests {
    use super::*;
    use std::str::FromStr;

    #[test]
    fn test_basic_arithmetic() {
        let calc = Calculator::default();
        
        let a = Decimal::from_str("10.5").unwrap();
        let b = Decimal::from_str("5.25").unwrap();
        
        assert_eq!(calc.add(a, b).unwrap(), Decimal::from_str("15.75").unwrap());
        assert_eq!(calc.subtract(a, b).unwrap(), Decimal::from_str("5.25").unwrap());
        assert_eq!(calc.multiply(a, b).unwrap(), Decimal::from_str("55.125").unwrap());
        assert_eq!(calc.divide(a, b).unwrap(), Decimal::from(2));
    }

    #[test]
    fn test_division_by_zero() {
        let calc = Calculator::default();
        
        let a = Decimal::from(10);
        let b = Decimal::ZERO;
        
        assert!(matches!(calc.divide(a, b), Err(MathError::DivisionByZero)));
    }

    #[test]
    fn test_power_operations() {
        let calc = Calculator::default();
        
        let base = Decimal::from(2);
        let exp = Decimal::from(3);
        
        assert_eq!(calc.power(base, exp).unwrap(), Decimal::from(8));
    }

    #[test]
    fn test_square_root() {
        let calc = Calculator::default();
        
        let x = Decimal::from(9);
        assert_eq!(calc.sqrt(x).unwrap(), Decimal::from(3));
        
        let neg = Decimal::from(-1);
        assert!(matches!(calc.sqrt(neg), Err(MathError::DomainError(_))));
    }

    #[test]
    fn test_factorial() {
        let calc = Calculator::default();
        
        assert_eq!(calc.factorial(Decimal::ZERO).unwrap(), Decimal::ONE);
        assert_eq!(calc.factorial(Decimal::from(5)).unwrap(), Decimal::from(120));
        
        let neg = Decimal::from(-1);
        assert!(matches!(calc.factorial(neg), Err(MathError::DomainError(_))));
        
        let float_val = Decimal::from_str("3.5").unwrap();
        assert!(matches!(calc.factorial(float_val), Err(MathError::DomainError(_))));
    }

    #[test]
    fn test_logarithms() {
        let calc = Calculator::default();
        
        let e = Decimal::from_str_exact(MathConstants::E).unwrap();
        assert!((calc.ln(e).unwrap() - Decimal::ONE).abs() < Decimal::from_str("0.0000001").unwrap());
        
        let ten = Decimal::from(10);
        assert!((calc.log10(ten).unwrap() - Decimal::ONE).abs() < Decimal::from_str("0.0000001").unwrap());
    }

    #[test]
    fn test_base_conversion() {
        let calc = Calculator::default();
        
        // 十进制转二进制
        assert_eq!(calc.to_base(Decimal::from(10), 2).unwrap(), "1010");
        
        // 十进制转十六进制
        assert_eq!(calc.to_base(Decimal::from(255), 16).unwrap(), "FF");
        
        // 二进制转十进制
        assert_eq!(calc.from_base("1010", 2).unwrap(), Decimal::from(10));
        
        // 十六进制转十进制
        assert_eq!(calc.from_base("FF", 16).unwrap(), Decimal::from(255));
    }

    #[test]
    fn test_bitwise_operations() {
        let calc = Calculator::default();
        
        let a = Decimal::from(12); // 1100 in binary
        let b = Decimal::from(10); // 1010 in binary
        
        // 按位与：1100 & 1010 = 1000 = 8
        assert_eq!(calc.bitwise_and(a, b).unwrap(), Decimal::from(8));
        
        // 按位或：1100 | 1010 = 1110 = 14
        assert_eq!(calc.bitwise_or(a, b).unwrap(), Decimal::from(14));
        
        // 按位异或：1100 ^ 1010 = 0110 = 6
        assert_eq!(calc.bitwise_xor(a, b).unwrap(), Decimal::from(6));
        
        // 左移：1100 << 1 = 11000 = 24
        assert_eq!(calc.bitwise_shift_left(a, Decimal::from(1)).unwrap(), Decimal::from(24));
        
        // 右移：1100 >> 1 = 0110 = 6
        assert_eq!(calc.bitwise_shift_right(a, Decimal::from(1)).unwrap(), Decimal::from(6));
    }

    #[test]
    fn test_complex_operations() {
        let calc = Calculator::default();
        
        // 复数加法：(3+4i) + (1+2i) = (4+6i)
        let (real, imag) = calc.complex_add(
            Decimal::from(3), Decimal::from(4),
            Decimal::from(1), Decimal::from(2)
        ).unwrap();
        assert_eq!(real, Decimal::from(4));
        assert_eq!(imag, Decimal::from(6));
        
        // 复数乘法：(3+4i) * (1+2i) = -5+10i
        let (real, imag) = calc.complex_multiply(
            Decimal::from(3), Decimal::from(4),
            Decimal::from(1), Decimal::from(2)
        ).unwrap();
        assert_eq!(real, Decimal::from(-5));
        assert_eq!(imag, Decimal::from(10));
    }

    #[test]
    fn test_statistics() {
        let calc = Calculator::default();
        
        let data = vec![
            Decimal::from(1),
            Decimal::from(2),
            Decimal::from(3),
            Decimal::from(4),
            Decimal::from(5),
        ];
        
        // 平均值
        assert_eq!(calc.mean(&data).unwrap(), Decimal::from(3));
        
        // 中位数
        assert_eq!(calc.median(&data).unwrap(), Decimal::from(3));
        
        // 最小值和最大值
        assert_eq!(calc.min(&data).unwrap(), Decimal::from(1));
        assert_eq!(calc.max(&data).unwrap(), Decimal::from(5));
        
        // 总和
        assert_eq!(calc.sum(&data).unwrap(), Decimal::from(15));
        
        // 总积
        assert_eq!(calc.product(&data).unwrap(), Decimal::from(120));
        
        // 范围
        assert_eq!(calc.range(&data).unwrap(), Decimal::from(4));
        
        // 方差
        let variance = calc.variance(&data).unwrap();
        assert!((variance - Decimal::from_str("2.5").unwrap()).abs() < Decimal::from_str("0.0001").unwrap());
    }

    #[test]
    fn test_matrix_operations() {
        let calc = Calculator::default();

        // 创建2x2矩阵
        let matrix_a = calc.create_matrix(2, 2, vec![
            Decimal::from(1), Decimal::from(2),
            Decimal::from(3), Decimal::from(4),
        ]).unwrap();

        let matrix_b = calc.create_matrix(2, 2, vec![
            Decimal::from(5), Decimal::from(6),
            Decimal::from(7), Decimal::from(8),
        ]).unwrap();

        // 矩阵加法
        let sum = calc.matrix_add(&matrix_a, &matrix_b).unwrap();
        assert_eq!(sum.get(0, 0).unwrap(), Decimal::from(6));
        assert_eq!(sum.get(1, 1).unwrap(), Decimal::from(12));

        // 矩阵乘法
        let product = calc.matrix_multiply(&matrix_a, &matrix_b).unwrap();
        assert_eq!(product.get(0, 0).unwrap(), Decimal::from(19)); // 1*5 + 2*7
        assert_eq!(product.get(0, 1).unwrap(), Decimal::from(22)); // 1*6 + 2*8

        // 矩阵转置
        let transposed = calc.matrix_transpose(&matrix_a);
        assert_eq!(transposed.get(0, 1).unwrap(), Decimal::from(3));
        assert_eq!(transposed.get(1, 0).unwrap(), Decimal::from(2));

        // 行列式计算
        let det = calc.matrix_determinant(&matrix_a).unwrap();
        assert_eq!(det, Decimal::from(-2)); // 1*4 - 2*3 = -2

        // 单位矩阵
        let identity = calc.matrix_identity(3);
        assert_eq!(identity.get(0, 0).unwrap(), Decimal::ONE);
        assert_eq!(identity.get(1, 1).unwrap(), Decimal::ONE);
        assert_eq!(identity.get(0, 1).unwrap(), Decimal::ZERO);
    }

    #[test]
    fn test_unit_conversion() {
        let calc = Calculator::default();

        // 长度转换
        let meters = calc.convert_unit(Decimal::from(1000), "mm", "m").unwrap();
        assert_eq!(meters, Decimal::ONE);

        let kilometers = calc.convert_unit(Decimal::from(2000), "m", "km").unwrap();
        assert_eq!(kilometers, Decimal::from(2));

        // 重量转换
        let kilograms = calc.convert_unit(Decimal::from(1000), "g", "kg").unwrap();
        assert_eq!(kilograms, Decimal::ONE);

        // 时间转换
        let seconds = calc.convert_unit(Decimal::from(2), "min", "s").unwrap();
        assert_eq!(seconds, Decimal::from(120));

        // 温度转换
        let fahrenheit = calc.convert_temperature(Decimal::from(0), "C", "F").unwrap();
        assert_eq!(fahrenheit, Decimal::from(32));

        let kelvin = calc.convert_temperature(Decimal::from(0), "C", "K").unwrap();
        assert_eq!(kelvin, Decimal::from_str("273.15").unwrap());
    }

    #[test]
    fn test_combinatorics() {
        let calc = Calculator::default();

        // 排列：P(5,3) = 5!/(5-3)! = 5!/2! = 60
        let perm = calc.permutation(Decimal::from(5), Decimal::from(3)).unwrap();
        assert_eq!(perm, Decimal::from(60));

        // 组合：C(5,3) = 5!/(3!*2!) = 10
        let comb = calc.combination(Decimal::from(5), Decimal::from(3)).unwrap();
        assert_eq!(comb, Decimal::from(10));

        // 最大公约数
        let gcd = calc.gcd(Decimal::from(48), Decimal::from(18)).unwrap();
        assert_eq!(gcd, Decimal::from(6));

        // 最小公倍数
        let lcm = calc.lcm(Decimal::from(12), Decimal::from(8)).unwrap();
        assert_eq!(lcm, Decimal::from(24));
    }

    #[test]
    fn test_hyperbolic_functions() {
        let calc = Calculator::default();

        // 双曲正弦：sinh(0) = 0
        let sinh_0 = calc.sinh(Decimal::ZERO).unwrap();
        assert!((sinh_0 - Decimal::ZERO).abs() < Decimal::from_str("0.0001").unwrap());

        // 双曲余弦：cosh(0) = 1
        let cosh_0 = calc.cosh(Decimal::ZERO).unwrap();
        assert!((cosh_0 - Decimal::ONE).abs() < Decimal::from_str("0.0001").unwrap());

        // 双曲正切：tanh(0) = 0
        let tanh_0 = calc.tanh(Decimal::ZERO).unwrap();
        assert!((tanh_0 - Decimal::ZERO).abs() < Decimal::from_str("0.0001").unwrap());
    }

    #[test]
    fn test_percentage_calculations() {
        let calc = Calculator::default();

        // 百分比计算：20% of 100 = 20
        let percent = calc.percentage(Decimal::from(100), Decimal::from(20)).unwrap();
        assert_eq!(percent, Decimal::from(20));

        // 百分比增长：从100到120是20%增长
        let increase = calc.percentage_increase(Decimal::from(100), Decimal::from(120)).unwrap();
        assert_eq!(increase, Decimal::from(20));
    }
}