// const winston = require('winston');
// const fs = require('fs');
// const path = require('path');

// if(!fs.existsSync('/var/log/webapp/app.log')){
//   fs.mkdirSync('/var/log/webapp/app.log',{recursive:true});
// }

// const logger = winston.createLogger({
//   level: 'info',
//   format: winston.format.combine(
//     winston.format.timestamp(),
//     winston.format.json()
//   ),
//   transports: [
//     new winston.transports.File({ 
//       filename: '/var/log/webapp/app.log',
//       handleExceptions: true
//     }),
//     new winston.transports.Console()
//   ]
// });

// module.exports = logger;

const fs = require('fs');
const winston = require('winston');

// Use a different log path for tests or development
const logDirectory = process.env.NODE_ENV === 'test' ? './logs' : '/var/log/webapp';
if (!fs.existsSync(logDirectory)) {
  fs.mkdirSync(logDirectory, { recursive: true });
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: `${logDirectory}/app.log`, handleExceptions: true }),
  ],
});

module.exports = logger;
