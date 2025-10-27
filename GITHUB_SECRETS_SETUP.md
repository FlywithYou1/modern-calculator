# 🔐 GitHub Secrets Configuration Guide

This document explains how to configure GitHub Secrets for Android app signing in the CI/CD pipeline.

## Overview

The project uses GitHub Secrets to securely store Android signing keys, ensuring they are never committed to the repository. This follows security best practices and enables automated builds without exposing sensitive credentials.

## Required Secrets

You need to configure the following secrets in your GitHub repository:

### 1. `ANDROID_KEYSTORE_BASE64`
- **Description**: Base64-encoded Android keystore file
- **How to generate**:
  ```bash
  # Linux/Mac
  cat your-keystore.jks | base64 -w 0 > keystore.txt
  
  # Windows (PowerShell)
  [Convert]::ToBase64String([IO.File]::ReadAllBytes("your-keystore.jks")) | Out-File keystore.txt
  ```
- **Value**: Copy the entire content of `keystore.txt`

### 2. `ANDROID_KEYSTORE_PASSWORD`
- **Description**: Password for the keystore file
- **Value**: The password you set when creating the keystore
- **Example**: `MySecureKeystorePassword123`

### 3. `ANDROID_KEY_ALIAS`
- **Description**: Alias of the key in the keystore
- **Value**: The alias you set when creating the key
- **Example**: `my-calculator-key`

### 4. `ANDROID_KEY_PASSWORD`
- **Description**: Password for the specific key
- **Value**: The key password (can be same as keystore password)
- **Example**: `MySecureKeyPassword123`

## Step-by-Step Configuration

### Step 1: Generate Android Keystore (If You Don't Have One)

```bash
keytool -genkey -v \
  -keystore my-calculator.jks \
  -alias my-calculator-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000 \
  -storepass YourKeystorePassword \
  -keypass YourKeyPassword \
  -dname "CN=Your Name, OU=Your Org, O=Your Company, L=City, S=State, C=US"
```

**Important**: Store the keystore file and passwords securely! You cannot recover them if lost.

### Step 2: Convert Keystore to Base64

**Linux/macOS:**
```bash
cat my-calculator.jks | base64 -w 0 > keystore-base64.txt
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("my-calculator.jks")) | Out-File keystore-base64.txt -Encoding ASCII
```

### Step 3: Add Secrets to GitHub

1. Go to your GitHub repository
2. Navigate to: **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add each secret:

   **Secret 1: ANDROID_KEYSTORE_BASE64**
   - Name: `ANDROID_KEYSTORE_BASE64`
   - Value: Paste the content from `keystore-base64.txt`
   
   **Secret 2: ANDROID_KEYSTORE_PASSWORD**
   - Name: `ANDROID_KEYSTORE_PASSWORD`
   - Value: Your keystore password
   
   **Secret 3: ANDROID_KEY_ALIAS**
   - Name: `ANDROID_KEY_ALIAS`
   - Value: Your key alias (e.g., `my-calculator-key`)
   
   **Secret 4: ANDROID_KEY_PASSWORD**
   - Name: `ANDROID_KEY_PASSWORD`
   - Value: Your key password

### Step 4: Verify Configuration

After adding all secrets:

1. Go to **Actions** tab in your repository
2. Manually trigger the workflow: **跨平台构建 (Linux + Windows + Android)**
3. Enable "是否构建Android" option
4. Check the workflow logs to ensure signing succeeds

## How It Works in CI/CD

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) performs these steps:

1. **Decode the keystore**:
   ```yaml
   - name: 解码签名密钥
     if: secrets.ANDROID_KEYSTORE_BASE64 != ''
     run: |
       echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 -d > keystore.jks
   ```

2. **Set environment variables**:
   ```yaml
   echo "KEYSTORE_PATH=$PWD/keystore.jks" >> $GITHUB_ENV
   echo "KEYSTORE_PASSWORD=${{ secrets.ANDROID_KEYSTORE_PASSWORD }}" >> $GITHUB_ENV
   ```

3. **Build the APK** (Tauri automatically uses these environment variables)

4. **Clean up** (remove temporary keystore file):
   ```yaml
   - name: 清理签名密钥
     if: always()
     run: rm -f keystore.jks
   ```

## Security Best Practices

✅ **DO:**
- Use strong, unique passwords for keystore and keys
- Store keystore backup in a secure location (encrypted USB, password manager)
- Rotate secrets every 90 days for high-security applications
- Use environment-specific secrets for dev/staging/prod

❌ **DON'T:**
- Never commit `.jks` or `.keystore` files to git
- Never share keystore passwords in plain text
- Never use the same keystore for multiple apps
- Never hardcode passwords in build scripts

## Troubleshooting

### Error: "Keystore file not found"
- Ensure `ANDROID_KEYSTORE_BASE64` is correctly encoded
- Verify the base64 string has no line breaks or extra spaces

### Error: "Incorrect password"
- Double-check `ANDROID_KEYSTORE_PASSWORD` and `ANDROID_KEY_PASSWORD`
- Ensure no trailing spaces in the secret values

### Error: "Key alias not found"
- Verify `ANDROID_KEY_ALIAS` matches the alias in your keystore
- List aliases with: `keytool -list -v -keystore my-calculator.jks`

### Build succeeds but app won't install
- Check signing certificate validity: `keytool -list -v -keystore my-calculator.jks`
- Ensure the keystore is valid and not expired

## Local Development

For local Android builds without GitHub Actions:

1. Place your keystore in `src-tauri/keystore/` (this directory is gitignored)
2. Set environment variables before building:

   **Linux/macOS:**
   ```bash
   export KEYSTORE_PATH="./keystore/my-calculator.jks"
   export KEYSTORE_PASSWORD="YourPassword"
   export KEY_ALIAS="my-calculator-key"
   export KEY_PASSWORD="YourKeyPassword"
   npm run android:build
   ```

   **Windows (PowerShell):**
   ```powershell
   $env:KEYSTORE_PATH=".\keystore\my-calculator.jks"
   $env:KEYSTORE_PASSWORD="YourPassword"
   $env:KEY_ALIAS="my-calculator-key"
   $env:KEY_PASSWORD="YourKeyPassword"
   npm run android:build
   ```

## Reference Links

- [GitHub Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [Android App Signing Guide](https://developer.android.com/studio/publish/app-signing)
- [Tauri Android Build Guide](https://tauri.app/v2/guides/building/android/)
- [Keystore Management Best Practices](https://developer.android.com/studio/publish/app-signing#secure-key)

## Support

If you encounter issues:
1. Check the [Troubleshooting](#troubleshooting) section above
2. Review GitHub Actions logs for detailed error messages
3. Consult the [ANDROID_SIGNING_SETUP.md](ANDROID_SIGNING_SETUP.md) guide
4. Open an issue on GitHub with error logs

---

**Last Updated**: 2025-10-26  
**Version**: 2.0.0
