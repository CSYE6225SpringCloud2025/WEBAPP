# WEBAPP
# Hello Test5
# 1. Health Check API

## Setup Instructions

1. **Clone the Repository**  
   Clone the repository by running the following command:
   ```bash
   git clone <repository url>

2. **Navigate to the `src` directory**  
   Run the following command:
   ```bash
   cd src
   
3. **Install dependencies**  
   Install the required Node.js modules by running:
   ```bash
   npm i

4. **Create the `.env` file**  
   Create a `.env` file in the `src` directory and add the following variables:
   ```dotenv
   DB_HOST=hostname
   DB_USERNAME=your_username
   DB_PASSWORD=your_password
   DB_NAME=your_db_name
   DB_DIALECT=mysql

5. **Start the application**  
   Start the application by running the following command:
   ```bash
   npm start


6. **Test the `healthz` API**  
   Use the following **cURL** commands to test the API:

   - **Valid request returning 200 OK**  
     ```bash
     curl -vvvv http://localhost:8080/healthz
     ```
     Expected response: **200 OK**

   - **Unsupported HTTP method returning 405**  
     ```bash
     curl -vvvv -XPUT http://localhost:8080/healthz
     ```
     Expected response: **405 Method Not Allowed**

   - **Invalid request body returning 400**  
     ```bash
     curl -vvvv -X GET -d '{}' -H "Content-Type: application/json" http://localhost:8080/healthz
     ```
     Expected response: **400 Bad Request**

   - **Database connection failure returning 503**  
     If the database connection is not established, the endpoint will return:
     **503 Service Unavailable**


##
     
# 2. Automating Application Setup with Shell Script

### DigitalOcean Setup

- **Create an account on DigitalOcean** → login → Click **Create Droplet**.
- **Create a Droplet (VM)**.
- Choose **Ubuntu 24.04 LTS** as the OS.
- Select a **Basic Plan** (with required RAM).
- Choose a **Region** close to you.
- Enable **SSH Authentication** (if you have an SSH key added).
- Click **Create Droplet**.

### Steps to Set Up the Application:

- **Connect to the VM**:
    ```bash
    ssh root@your_droplet_ip
    ```

- **Upload `setup.sh` to Ubuntu**:
    ```bash
    scp -i ~/.ssh/DigitalOcean setup.sh root@your_droplet_ip:/root/
    ```

- **Give Execution Permission to `setup.sh`**:
    ```bash
    chmod +x setup.sh
    ```

- **Upload & Extract `app.zip`**:
    On your local machine, run:
    ```bash
    scp -i ~/.ssh/DigitalOcean app.zip root@your_droplet_ip:/temp/
    ```

- **Run `setup.sh`**:
    ```bash
    ./setup.sh
    ```

- **To run the application**:
    - Run `npm install`:
      ```bash
      npm i
      ```
    - Start the application:
      ```bash
      npm start
      ```
    - Run the `curl` commands as per the instructions.

---

# 3. Running Test Cases Locally

- Install Jest and Supertest as dev dependencies:
    ```bash
    npm install --save-dev jest supertest
    ```
    