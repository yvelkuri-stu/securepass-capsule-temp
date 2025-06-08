
// 📁 README.md
# SecurePass Capsule

A modern, secure personal data storage application built with Next.js 14, featuring zero-knowledge encryption and cross-platform PWA capabilities.

## Features

- 🔐 **Zero-Knowledge Encryption**: Client-side encryption ensures your data remains private
- 🛡️ **Multi-Factor Authentication**: Biometric, hardware keys, and TOTP support
- 📱 **Progressive Web App**: Install on any device with native-like experience
- 🤖 **AI-Powered Organization**: Smart categorization and content management
- 🔄 **Cross-Device Sync**: Secure synchronization across all your devices
- 👥 **Secure Sharing**: Granular permissions and time-locked access
- ⚡ **Modern UI**: Beautiful, responsive interface with smooth animations

## Tech Stack

- **Frontend**: Next.js 14, React 18, TypeScript
- **UI**: ShadCN UI, Tailwind CSS, Framer Motion
- **State**: Zustand, TanStack Query, Jotai
- **Security**: Web Crypto API, CryptoJS
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel, Cloudflare

## Quick Start

1. **Clone and Install**
   ```bash
   git clone <your-repo>
   cd securepass-capsule
   npm install
   ```

2. **Environment Setup**
   ```bash
   cp .env.example .env.local
   # Add your Supabase credentials
   ```

3. **Development**
   ```bash
   npm run dev
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm start
   ```

## Project Structure

```
securepass-capsule/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                 # Utility functions
│   ├── store/               # Zustand stores
│   ├── types/               # TypeScript definitions
│   └── hooks/               # Custom React hooks
├── public/                  # Static assets
└── docs/                    # Documentation
```

## Security Features

- **Client-side Encryption**: All data encrypted before leaving your device
- **Zero-Knowledge Architecture**: Server never sees unencrypted data
- **Biometric Authentication**: Face ID, Touch ID, Windows Hello
- **Hardware Security Keys**: YubiKey and WebAuthn support
- **Audit Logging**: Track all access to your capsules
- **Emergency Access**: Configurable dead man's switch

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit changes: `git commit -m 'Add amazing feature'`
4. Push to branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) file for details.

## Support

For support, email support@securepass.app or join our [Discord community](https://discord.gg/securepass).

---

**Your data, your control.** 🔐