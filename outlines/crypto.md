# Crypto Module

The crypto module provides cryptographic operations including key generation, signing, verification, hashing, and password-based encryption. It uses Ed25519 for digital signatures and AES-GCM for encryption.

## Environment Compatibility

* Support both browser and Deno environments

```javascript
const cryptoProvider = typeof window !== "undefined" ? window.crypto : globalThis.crypto;
```

## Key Management

### Generating New Keys

Generate a new Ed25519 key pair:

```typescript
const keys = genKeys();
// Returns: { privateKey: string, publicKey: string }
```

### Loading Existing Keys

Load an encrypted private key using a password:

```typescript
const keys = await getKeys(encryptedPrivateKey, password);
// Returns: { privateKey: string, publicKey: string }
```

## Digital Signatures

### Signing Data

Sign data using a private key:

```typescript
const signature = sign(privateKey, data);
// Returns: base58-encoded signature
```

### Verifying Signatures

Verify a signature using a public key:

```typescript
const isValid = verify(publicKey, data, signature);
// Returns: boolean
```

## Hashing

Create a SHA-256 hash of any data structure:

```typescript
const hashValue = await hash(data);
// Returns: base58-encoded hash
```

## Password-Based Encryption

### Encrypting Data

Encrypt data using a password:

```typescript
const encrypted = await encrypt(secretData, password);
// Returns: encrypted string or undefined if encryption fails
```

### Decrypting Data

Decrypt previously encrypted data:

```typescript
const decrypted = await decrypt(encryptedData, password);
// Returns: decrypted string or undefined if decryption fails
```

## Implementation Details

- Uses Ed25519 for asymmetric cryptography
- Uses AES-GCM (256-bit) for symmetric encryption
- PBKDF2 for key derivation with 250,000 iterations
- Base58 encoding for keys and signatures
- SHA-256 for hashing
- Supports both browser and Deno environments
