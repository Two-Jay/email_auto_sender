# CLAUDE.md - AI Assistant Guide for Email Auto Sender

This document provides comprehensive guidance for AI assistants working on the Email Auto Sender codebase.

## Project Overview

**Email Auto Sender** is an automated email sending system designed to streamline email communications. The project aims to provide reliable, scheduled, and template-based email sending capabilities.

### Key Objectives
- Automate email sending workflows
- Support multiple email providers (SMTP, API-based services)
- Provide template management and personalization
- Enable scheduled and batch email operations
- Ensure secure credential management
- Track email delivery status and metrics

## Repository Information

- **Repository**: Two-Jay/email_auto_sender
- **Primary Branch**: TBD (will be established upon first commit)
- **Development Branch Pattern**: `claude/claude-md-<session-id>`
- **Status**: New repository (no commits yet)

## Codebase Structure (Planned)

```
email_auto_sender/
├── src/                    # Source code
│   ├── config/            # Configuration management
│   ├── services/          # Email service providers
│   ├── templates/         # Email template engine
│   ├── scheduler/         # Job scheduling logic
│   ├── models/            # Data models
│   ├── utils/             # Helper utilities
│   └── index.js/ts        # Main entry point
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   └── integration/      # Integration tests
├── templates/             # Email template files
├── config/               # Configuration files
│   └── .env.example      # Environment variables template
├── docs/                 # Documentation
├── scripts/              # Utility scripts
├── package.json          # Node.js dependencies (if applicable)
├── requirements.txt      # Python dependencies (if applicable)
├── .gitignore           # Git ignore rules
├── README.md            # Project documentation
└── CLAUDE.md            # This file
```

## Technology Stack Considerations

### Backend Options
- **Node.js**: Popular for email services, excellent async handling
  - Libraries: nodemailer, node-schedule, handlebars
- **Python**: Strong email and automation libraries
  - Libraries: smtplib, schedule, jinja2, celery

### Email Service Providers
- **SMTP**: Direct mail server connection
- **SendGrid**: API-based email delivery
- **AWS SES**: Amazon Simple Email Service
- **Mailgun**: Transactional email API
- **Postmark**: Transactional email service

### Storage & Database
- **SQLite**: Lightweight for logs and tracking
- **PostgreSQL/MySQL**: Production-grade relational DB
- **MongoDB**: NoSQL for flexible schema
- **Redis**: Caching and job queues

## Development Workflows

### 1. Initial Setup

When setting up the project for the first time:

```bash
# Clone and navigate to repository
cd /home/user/email_auto_sender

# Initialize your language environment
# For Node.js:
npm init -y
npm install

# For Python:
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements.txt
```

### 2. Branch Management

- **Always work on designated Claude branches**: `claude/claude-md-<session-id>`
- **Never push directly to main/master without explicit permission**
- **Create feature branches from the current development branch**

```bash
# Verify current branch
git status

# Create new feature branch if needed
git checkout -b feature/your-feature-name

# After completing work, push to designated branch
git push -u origin claude/claude-md-<session-id>
```

### 3. Commit Guidelines

Follow conventional commit format:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples**:
```
feat(email): add SendGrid integration
fix(scheduler): resolve timezone handling bug
docs(readme): update installation instructions
```

### 4. Testing Strategy

- Write tests before or alongside implementation
- Maintain minimum 80% code coverage
- Run tests before committing

```bash
# Run all tests
npm test  # or pytest

# Run specific test file
npm test tests/unit/email.test.js

# Run with coverage
npm test -- --coverage
```

### 5. Code Review Checklist

Before committing, verify:
- [ ] Code follows project style conventions
- [ ] No sensitive data (API keys, passwords) in code
- [ ] Environment variables used for configuration
- [ ] Tests pass successfully
- [ ] Documentation updated if needed
- [ ] No debug/console logs in production code
- [ ] Error handling implemented properly
- [ ] Security best practices followed

## Key Conventions for AI Assistants

### Security Requirements

1. **Never hardcode sensitive data**:
   - API keys, passwords, tokens → Use environment variables
   - Create `.env.example` with dummy values
   - Add `.env` to `.gitignore`

2. **Input validation**:
   - Validate all email addresses
   - Sanitize user inputs
   - Prevent email injection attacks

3. **Rate limiting**:
   - Implement rate limits to prevent abuse
   - Respect email provider limits

4. **Encryption**:
   - Use TLS/SSL for SMTP connections
   - Encrypt stored credentials

### Code Quality Standards

1. **Modular design**:
   - Single responsibility principle
   - Reusable components
   - Clear separation of concerns

2. **Error handling**:
   - Always use try-catch blocks
   - Log errors appropriately
   - Provide meaningful error messages
   - Implement retry logic for transient failures

3. **Naming conventions**:
   - Use descriptive variable/function names
   - Follow language-specific conventions (camelCase for JS, snake_case for Python)
   - Constants in UPPER_CASE

4. **Comments and documentation**:
   - Document complex logic
   - Add JSDoc/docstrings for functions
   - Keep README.md updated

### Email-Specific Best Practices

1. **Template management**:
   - Use template engines (Handlebars, Jinja2)
   - Support variable substitution
   - Provide plain-text alternatives to HTML

2. **Scheduling**:
   - Use cron or job scheduling libraries
   - Handle timezone conversions properly
   - Implement job persistence (survive restarts)

3. **Delivery tracking**:
   - Log all email attempts
   - Track delivery status
   - Handle bounces and complaints

4. **Batch processing**:
   - Send emails in batches to avoid rate limits
   - Implement queue system for large volumes
   - Add delays between batches

5. **Testing**:
   - Use test email addresses
   - Mock email providers in tests
   - Test with various email clients

### Configuration Management

Always use environment variables for:
- Email provider credentials
- SMTP server details
- API keys and tokens
- Database connection strings
- Application settings

Example `.env.example`:
```env
# Email Provider Configuration
EMAIL_PROVIDER=smtp
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your_username
SMTP_PASS=your_password

# API Keys (if using email service APIs)
SENDGRID_API_KEY=your_api_key_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=email_sender
DB_USER=user
DB_PASS=password

# Application Settings
NODE_ENV=development
LOG_LEVEL=info
RATE_LIMIT_PER_MINUTE=60
```

## Common Tasks

### Adding a New Email Provider

1. Create provider interface in `src/services/providers/`
2. Implement provider-specific logic
3. Add provider configuration to config
4. Write unit tests for the provider
5. Update documentation

### Creating Email Templates

1. Add template file to `templates/` directory
2. Use consistent variable naming: `{{variable_name}}`
3. Include both HTML and plain-text versions
4. Test with sample data
5. Document available variables

### Implementing Scheduled Emails

1. Define schedule configuration
2. Create job handler function
3. Register job with scheduler
4. Add persistence/recovery logic
5. Test schedule execution

## Troubleshooting Guide

### Email Not Sending

1. Check SMTP/API credentials
2. Verify network connectivity
3. Check provider rate limits
4. Review error logs
5. Validate email addresses

### Authentication Failures

1. Verify credentials in environment variables
2. Check for special characters in passwords
3. Ensure TLS/SSL settings match provider requirements
4. Test with provider's diagnostic tools

### Scheduling Issues

1. Verify timezone configuration
2. Check system time
3. Review cron expression syntax
4. Ensure scheduler service is running

## Git Operations Best Practices

### Pushing Changes

```bash
# Always push to the designated Claude branch
git push -u origin claude/claude-md-<session-id>

# If push fails due to network errors, retry with exponential backoff
# The system will automatically retry up to 4 times: 2s, 4s, 8s, 16s
```

### Fetching Updates

```bash
# Fetch specific branch
git fetch origin <branch-name>

# Pull with explicit branch
git pull origin <branch-name>
```

### Safety Rules

- **NEVER** update git config without permission
- **NEVER** force push to main/master
- **NEVER** skip hooks (--no-verify) without explicit request
- **AVOID** `git commit --amend` unless explicitly required
- **AVOID** destructive operations (hard reset, force push)

## Communication Standards

### When Reporting Progress

- Be concise and specific
- Use technical accuracy over emotional validation
- Focus on facts and problem-solving
- Report both successes and blockers

### When Asking Questions

- Use AskUserQuestion tool for clarifications
- Present options without time estimates
- Focus on what needs to be done, not when
- Provide technical context for decisions

## Resources & References

### Email Standards
- RFC 5321 (SMTP)
- RFC 5322 (Internet Message Format)
- CAN-SPAM Act compliance
- GDPR email guidelines

### Libraries & Tools

**Node.js**:
- nodemailer - Email sending
- node-schedule - Job scheduling
- handlebars - Template engine
- dotenv - Environment management

**Python**:
- smtplib - SMTP protocol
- email - Email message construction
- schedule - Job scheduling
- jinja2 - Template engine

## Version History

- **2026-01-16**: Initial CLAUDE.md creation for new repository

## Notes for AI Assistants

1. **Always read before writing**: Never propose changes to code you haven't read
2. **Use TodoWrite**: Track tasks using the TodoWrite tool for complex work
3. **Avoid over-engineering**: Keep solutions simple and focused
4. **Security first**: Always validate inputs and protect credentials
5. **Test thoroughly**: Write and run tests before committing
6. **Document decisions**: Update this file when adding new patterns or conventions
7. **Parallel operations**: When possible, make independent tool calls in parallel
8. **Ask when uncertain**: Use AskUserQuestion tool for clarifications

---

**Last Updated**: 2026-01-16
**Maintained by**: AI Assistants working on this repository
**Review Schedule**: Update when significant architecture changes occur
