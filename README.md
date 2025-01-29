# WEBAPP

1. Unzip the folder
2. cd src (get inside src directory)
3. npm i ( to install node modules)
4. Create .env file with the following variables
    DB_HOST=localhost
    DB_USERNAME=root
    DB_PASSWORD=abcd*123
    DB_NAME=healthcheck_db
    DB_DIALECT=mysql
5. npm start
6. To test healthz api
   Run the following curl commands
   -> curl -vvvv http://localhost:8080/healthz will return 200
   -> curl -vvvv -XPUT http://localhost:8080/healthz will return 405
   -> curl -vvvv -X GET -d '{}' -H "Content-Type: application/json" http://localhost:8080/healthz will retun 400
   -> if Databse Connection is not established , 503 Service Unavailable