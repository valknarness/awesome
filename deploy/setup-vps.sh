#!/bin/bash
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║  AWESOME Database VPS Deployment Setup                    ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Default values
DEFAULT_SSH_HOST="root@vps"
DEFAULT_USER="root"
DEFAULT_WORK_DIR="/root"
DEFAULT_AWESOME_CMD="/usr/local/bin/awesome"
DEFAULT_LOG_FILE="/var/log/awesome-index.log"
DEFAULT_DB_SOURCE="/root/.awesome/awesome.db"
DEFAULT_DB_STAGING="/tmp/awesome-database"
DEFAULT_CONTAINER="awesome_app"
DEFAULT_CONTAINER_PATH="/home/node/.awesome"
DEFAULT_SCHEDULE_TIME="02:00"
DEFAULT_INCREMENTAL="true"

# Prompt for values
echo -e "${YELLOW}Please provide the following configuration:${NC}"
echo ""

read -p "SSH host [${DEFAULT_SSH_HOST}]: " SSH_HOST
SSH_HOST="${SSH_HOST:-$DEFAULT_SSH_HOST}"

read -p "User to run service as [${DEFAULT_USER}]: " USER
USER="${USER:-$DEFAULT_USER}"

read -p "Working directory [${DEFAULT_WORK_DIR}]: " WORK_DIR
WORK_DIR="${WORK_DIR:-$DEFAULT_WORK_DIR}"

read -p "Awesome command path [${DEFAULT_AWESOME_CMD}]: " AWESOME_CMD
AWESOME_CMD="${AWESOME_CMD:-$DEFAULT_AWESOME_CMD}"

read -p "Log file path [${DEFAULT_LOG_FILE}]: " LOG_FILE
LOG_FILE="${LOG_FILE:-$DEFAULT_LOG_FILE}"

read -p "Database source path [${DEFAULT_DB_SOURCE}]: " DB_SOURCE
DB_SOURCE="${DB_SOURCE:-$DEFAULT_DB_SOURCE}"

read -p "Database staging directory [${DEFAULT_DB_STAGING}]: " DB_STAGING
DB_STAGING="${DB_STAGING:-$DEFAULT_DB_STAGING}"

read -p "Docker container name (leave empty to skip Docker deployment) [${DEFAULT_CONTAINER}]: " CONTAINER
CONTAINER="${CONTAINER:-$DEFAULT_CONTAINER}"

if [ -n "$CONTAINER" ]; then
    read -p "Container database path [${DEFAULT_CONTAINER_PATH}]: " CONTAINER_PATH
    CONTAINER_PATH="${CONTAINER_PATH:-$DEFAULT_CONTAINER_PATH}"
fi

read -p "Schedule time (HH:MM format) [${DEFAULT_SCHEDULE_TIME}]: " SCHEDULE_TIME
SCHEDULE_TIME="${SCHEDULE_TIME:-$DEFAULT_SCHEDULE_TIME}"

read -p "Use incremental indexing by default? (true/false) [${DEFAULT_INCREMENTAL}]: " INCREMENTAL
INCREMENTAL="${INCREMENTAL:-$DEFAULT_INCREMENTAL}"

# Confirmation
echo ""
echo -e "${YELLOW}Configuration Summary:${NC}"
echo "  SSH Host:           $SSH_HOST"
echo "  User:               $USER"
echo "  Working Directory:  $WORK_DIR"
echo "  Awesome Command:    $AWESOME_CMD"
echo "  Log File:           $LOG_FILE"
echo "  Database Source:    $DB_SOURCE"
echo "  Database Staging:   $DB_STAGING"
echo "  Docker Container:   ${CONTAINER:-<not configured>}"
if [ -n "$CONTAINER" ]; then
    echo "  Container Path:     $CONTAINER_PATH"
fi
echo "  Schedule Time:      $SCHEDULE_TIME"
echo "  Incremental:        $INCREMENTAL"
echo ""

read -p "Continue with deployment? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ] && [ "$CONFIRM" != "Y" ]; then
    echo -e "${RED}Deployment cancelled.${NC}"
    exit 0
fi

echo ""
echo -e "${BLUE}Starting deployment...${NC}"

# Create temporary directory for processed files
TEMP_DIR=$(mktemp -d)
trap "rm -rf $TEMP_DIR" EXIT

# Process templates
echo -e "${YELLOW}→${NC} Processing templates..."

SCRIPT_PATH="$WORK_DIR/scripts/awesome-index.sh"

# Process awesome-index.sh
sed -e "s|{{LOG_FILE}}|$LOG_FILE|g" \
    -e "s|{{DB_SOURCE}}|$DB_SOURCE|g" \
    -e "s|{{DB_STAGING}}|$DB_STAGING|g" \
    -e "s|{{CONTAINER}}|$CONTAINER|g" \
    -e "s|{{CONTAINER_PATH}}|$CONTAINER_PATH|g" \
    -e "s|{{AWESOME_CMD}}|$AWESOME_CMD|g" \
    -e "s|{{INCREMENTAL}}|$INCREMENTAL|g" \
    "$SCRIPT_DIR/awesome-index.sh.template" > "$TEMP_DIR/awesome-index.sh"

# Process awesome-index.service
sed -e "s|{{USER}}|$USER|g" \
    -e "s|{{WORK_DIR}}|$WORK_DIR|g" \
    -e "s|{{SCRIPT_PATH}}|$SCRIPT_PATH|g" \
    "$SCRIPT_DIR/awesome-index.service.template" > "$TEMP_DIR/awesome-index.service"

# Process awesome-index.timer
sed -e "s|{{SCHEDULE_TIME}}|$SCHEDULE_TIME|g" \
    "$SCRIPT_DIR/awesome-index.timer.template" > "$TEMP_DIR/awesome-index.timer"

echo -e "${GREEN}✓${NC} Templates processed"

# Test SSH connection
echo -e "${YELLOW}→${NC} Testing SSH connection..."
if ssh "$SSH_HOST" "echo 'Connection successful'" &>/dev/null; then
    echo -e "${GREEN}✓${NC} SSH connection successful"
else
    echo -e "${RED}✗${NC} SSH connection failed"
    exit 1
fi

# Create directories on remote server
echo -e "${YELLOW}→${NC} Creating directories on remote server..."
ssh "$SSH_HOST" "mkdir -p $WORK_DIR/scripts /etc/systemd/system"
echo -e "${GREEN}✓${NC} Directories created"

# Copy script to remote server
echo -e "${YELLOW}→${NC} Copying indexing script..."
scp "$TEMP_DIR/awesome-index.sh" "$SSH_HOST:$SCRIPT_PATH"
ssh "$SSH_HOST" "chmod +x $SCRIPT_PATH"
echo -e "${GREEN}✓${NC} Script copied and made executable"

# Copy systemd files
echo -e "${YELLOW}→${NC} Installing systemd service and timer..."
scp "$TEMP_DIR/awesome-index.service" "$SSH_HOST:/etc/systemd/system/"
scp "$TEMP_DIR/awesome-index.timer" "$SSH_HOST:/etc/systemd/system/"
echo -e "${GREEN}✓${NC} Systemd files installed"

# Reload systemd and enable timer
echo -e "${YELLOW}→${NC} Enabling systemd timer..."
ssh "$SSH_HOST" "systemctl daemon-reload && systemctl enable awesome-index.timer && systemctl start awesome-index.timer"
echo -e "${GREEN}✓${NC} Timer enabled and started"

# Show status
echo ""
echo -e "${GREEN}╔════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║  Deployment completed successfully!                        ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Status on remote server:${NC}"
ssh "$SSH_HOST" "systemctl status awesome-index.timer --no-pager" || true
echo ""
echo -e "${YELLOW}Next scheduled run:${NC}"
ssh "$SSH_HOST" "systemctl list-timers awesome-index.timer --no-pager" || true
echo ""
echo -e "${YELLOW}Useful commands:${NC}"
echo "  View logs:          ssh $SSH_HOST 'journalctl -u awesome-index.service -f'"
echo "  Manual trigger:     ssh $SSH_HOST 'systemctl start awesome-index.service'"
echo "  Check timer status: ssh $SSH_HOST 'systemctl status awesome-index.timer'"
echo "  View log file:      ssh $SSH_HOST 'tail -f $LOG_FILE'"
echo ""
