const winston = require('winston');
const fs = require('fs');
const path = require('path');

if(!fs.existsSync('/var/log/webapp/app.log')){
  fs.mkdirSync('/var/log/webapp/app.log',{recursive:true});
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ 
      filename: '/var/log/webapp/app.log',
      handleExceptions: true
    }),
    new winston.transports.Console()
  ]
});

module.exports = logger;