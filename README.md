# PensionOS

PensionOS is an AI-powered pension intelligence platform designed to simplify pension plan discovery and understanding for pension intermediaries and brokers managing company pension schemes.

## Overview

PensionOS transforms how professionals navigate complex pension plans with an intelligent search and retrieval system. Using natural language processing, it enables users to quickly find relevant pension plans, requirements, and key details without the need to dig through complex documentation.

## Features

- 🔍 **Natural Language Search**: Easily find pension plan details using conversational queries
- 📊 **Plan Comparison**: Quick comparison of similar pension plans across companies
- 🤖 **AI-Powered Analysis**: Intelligent processing of pension documentation
- 📱 **Modern Web Interface**: Clean, intuitive user experience
- 🔄 **Real-time Processing**: Instant access to plan requirements and specifications
- 👥 **Comprehensive Views**: Complete overview of participant information and plan structures

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- Docker and Docker Compose
- Git

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PensionOS.git
cd PensionOS
```

2. Install dependencies:
```bash
# Install web application dependencies
cd web/webapp
npm install
```

3. Start the development environment:
```bash
# From the root directory
docker-compose up -d
```

4. Run the web application:
```bash
cd web/webapp
npm run dev
```

The application will be available at `http://localhost:3000`

## Project Structure

```
PensionOS/
├── web/                    # Web application
│   └── webapp/            
│       ├── app/           # Next.js pages and API routes
│       ├── components/    # Reusable UI components
│       └── lib/          # Utilities and stores
├── docker-compose.yml     # Docker services configuration
└── README.md             # This file
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.
