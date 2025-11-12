# macOS Code Signing Setup for GitHub Actions

This document explains how to configure GitHub Secrets for signing and notarizing the macOS build of mkv-chapter-maker.

## Prerequisites

1. **Apple Developer Account**: You need an active Apple Developer Program membership ($99/year)
2. **Developer ID Application Certificate**: Request and download from [Apple Developer Portal](https://developer.apple.com/account/resources/certificates/list)

## Required GitHub Secrets

Add the following secrets to your GitHub repository (Settings > Secrets and variables > Actions > New repository secret):

### 1. CSC_LINK

**Purpose**: Base64-encoded code signing certificate

**How to obtain**:

1. Open **Keychain Access** on macOS
2. Find your "Developer ID Application" certificate under "My Certificates"
3. Select both the certificate and its private key
4. Right-click > Export 2 items
5. Save as `.p12` file with a strong password (this becomes `CSC_KEY_PASSWORD`)
6. Convert to base64:
   ```bash
   base64 -i certificate.p12 | pbcopy
   ```
7. Paste the output as the `CSC_LINK` secret value

### 2. CSC_KEY_PASSWORD

**Purpose**: Password for the .p12 certificate file

**Value**: The password you set when exporting the certificate in step 5 above

### 3. APPLE_ID

**Purpose**: Apple ID for notarization

**Value**: Your Apple ID email address (e.g., `developer@example.com`)

### 4. APPLE_APP_SPECIFIC_PASSWORD

**Purpose**: App-specific password for notarization API access

**How to obtain**:

1. Go to [appleid.apple.com](https://appleid.apple.com)
2. Sign in with your Apple ID
3. Go to **Sign-In and Security** > **App-Specific Passwords**
4. Click **Generate an app-specific password**
5. Enter a name (e.g., "GitHub Actions")
6. Copy the generated password and save it as the `APPLE_APP_SPECIFIC_PASSWORD` secret

### 5. APPLE_TEAM_ID

**Purpose**: Your Apple Developer Team ID for notarization

**How to obtain**:

1. Go to [Apple Developer Portal](https://developer.apple.com/account/)
2. Click **Membership** in the sidebar
3. Copy your **Team ID** (10-character alphanumeric string)
4. Save it as the `APPLE_TEAM_ID` secret

## Verification

Once all secrets are configured:

1. Create a new tag (e.g., `v1.0.4`) to trigger the release workflow
2. Monitor the GitHub Actions workflow
3. The macOS build should:
   - Import the certificate into a temporary keychain
   - Sign the application with your Developer ID
   - Submit to Apple for notarization
   - Staple the notarization ticket to the DMG

## Testing Signed Build

After downloading the signed DMG:

```bash
# Check code signature
codesign -dv --verbose=4 /Applications/mkv-chapter-maker.app

# Verify notarization
spctl -a -t exec -vvv /Applications/mkv-chapter-maker.app
```

## Troubleshooting

- **Certificate import fails**: Verify `CSC_LINK` is properly base64-encoded without line breaks
- **Notarization timeout**: Apple's service can take 5-20 minutes; check workflow logs
- **Gatekeeper blocks app**: Ensure notarization completed successfully and ticket was stapled

## Security Notes

- Never commit certificates or passwords to the repository
- Rotate `APPLE_APP_SPECIFIC_PASSWORD` if compromised
- GitHub Secrets are encrypted and only accessible to workflow runs
- The temporary keychain is deleted after each build
