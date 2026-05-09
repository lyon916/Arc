# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |

## Reporting a Vulnerability

If you discover a security vulnerability in Arc, please report it by:

- **Email**: Open an issue on GitHub for now (we'll set up a dedicated security contact)
- **GitHub**: [Report a vulnerability](https://github.com/lyon916/Arc/security/advisories/new) (private disclosure)

Please do **not** report security vulnerabilities through public issues.

## Data Privacy

Arc is a client-side SPA. All data (request history, collections, environment variables) is stored **locally in your browser's IndexedDB**. Nothing is sent to any server.

## Third-Party Services

The only third-party service is Google Analytics (GA4), which can be disabled by removing the script tag from `index.html` if you self-host.
