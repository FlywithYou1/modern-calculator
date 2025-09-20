#!/bin/bash
# Android 开发环境配置脚本

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

echo "🎉 Android 环境配置完成！"