#!/bin/bash

# Set variables
DB_NAME="csye6225_db"
DB_USER="root"
DB_PASS="abcd*123"
APP_GROUP="csye6225_group"
APP_USER="csye6225_user"
APP_DIR="/opt/csye6225"
ZIP_FILE="/app.zip"
ROOT_PASS="my_password"  # Add this to set root password

# Update and upgrade packages
echo "Updating system packages..."
sudo apt update && sudo apt upgrade -y

# Fixing broken packages if needed
echo "Fixing broken dependencies..."
sudo apt --fix-broken install -y

# Removing any existing MySQL installation to prevent conflicts
echo "Removing previous MySQL installation (if any)..."
sudo apt remove --purge mysql-server mysql-client mysql-common mysql-server-core-* mysql-client-core-* -y || true
sudo rm -rf /etc/mysql /var/lib/mysql /var/log/mysql
sudo apt autoremove -y
sudo apt autoclean -y


# Install MySQL Server
echo "Installing MySQL Server..."
sudo apt install -y mysql-server

# Secure MySQL installation (Optional, Uncomment if needed)
# echo "Securing MySQL installation..."
# sudo mysql_secure_installation

# Start MySQL and enable it at boot
echo "Starting MySQL service..."
sudo systemctl start mysql
sudo systemctl enable mysql

# Set MySQL root password and change authentication plugin to use password
echo "Configuring MySQL root password..."
sudo mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '$ROOT_PASS';"
sudo mysql -e "FLUSH PRIVILEGES;"

# Create MySQL database and user
echo "Creating MySQL database and user..."
sudo mysql -u root -p$ROOT_PASS -e "CREATE DATABASE IF NOT EXISTS $DB_NAME;"
sudo mysql -u root -p$ROOT_PASS -e "CREATE USER IF NOT EXISTS '$DB_USER'@'localhost' IDENTIFIED BY '$DB_PASS';"
sudo mysql -u root -p$ROOT_PASS -e "GRANT ALL PRIVILEGES ON $DB_NAME.* TO '$DB_USER'@'localhost';"
sudo mysql -u root -p$ROOT_PASS -e "FLUSH PRIVILEGES;"

# Create Linux group and user
echo "Creating Linux group and user..."
sudo groupadd $APP_GROUP
sudo useradd -m -g $APP_GROUP -s /bin/bash $APP_USER

# Create application directory
echo "Setting up application directory..."
sudo mkdir -p $APP_DIR

# Unzip application
echo "Extracting application..."
sudo apt install -y unzip  # Ensure unzip is installed
sudo unzip -o $ZIP_FILE -d $APP_DIR

# Change ownership and permissions
echo "Updating permissions..."
sudo chown -R $APP_USER:$APP_GROUP $APP_DIR
sudo chmod -R 750 $APP_DIR

# Done
echo "Setup complete!"
