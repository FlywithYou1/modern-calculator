#!/bin/bash
# 创建或更新 Android 开发证书和配置

echo "🔐 配置 Android 签名证书..."

KEYSTORE_DIR="src-tauri/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/calculator.keystore"
ALIAS="calculator"
STORE_PASSWORD="calculator123"
KEY_PASSWORD="calculator123"

# 创建目录
mkdir -p "$KEYSTORE_DIR"

# 生成开发用签名证书
if [ ! -f "$KEYSTORE_FILE" ]; then
    echo "📝 生成开发用签名证书..."
    keytool -genkey -v \
        -keystore "$KEYSTORE_FILE" \
        -alias "$ALIAS" \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -storepass "$STORE_PASSWORD" \
        -keypass "$KEY_PASSWORD" \
        -dname "CN=Calculator App, OU=Calculator Team, O=Scientific Calculator, L=Beijing, ST=Beijing, C=CN"
    
    echo "✅ 签名证书已生成: $KEYSTORE_FILE"
else
    echo "✅ 签名证书已存在: $KEYSTORE_FILE"
fi

# 验证证书信息
echo "🔍 验证证书信息:"
keytool -list -v -keystore "$KEYSTORE_FILE" -storepass "$STORE_PASSWORD" | head -20

# 创建证书信息文件
cat > "$KEYSTORE_DIR/keystore-info.txt" << EOF
Android 签名证书信息
==================

文件路径: $KEYSTORE_FILE  
密钥别名: $ALIAS
Store 密码: $STORE_PASSWORD
Key 密码: $KEY_PASSWORD
算法: RSA 2048位
有效期: 10000天

⚠️  注意事项:
1. 此为开发测试用证书，生产环境请使用正式证书
2. 请妥善保管密钥文件和密码
3. 发布到 Google Play 需要使用 Play App Signing
4. 证书密码已在 tauri.conf.json 中配置

生成时间: $(date)
EOF

echo "📄 证书信息已保存到: $KEYSTORE_DIR/keystore-info.txt"

# 检查 Android targets
echo "🎯 检查 Rust Android targets..."
TARGETS=("aarch64-linux-android" "armv7-linux-androideabi" "i686-linux-android" "x86_64-linux-android")

for target in "${TARGETS[@]}"; do
    if rustup target list --installed | grep -q "$target"; then
        echo "✅ $target"
    else
        echo "⚠️  正在安装 $target..."
        rustup target add "$target"
    fi
done

echo "🎉 Android 签名配置完成！"