const fs = require('fs');
const Handlebars = require('handlebars');
const nodemailer = require('nodemailer');
const { promisify } = require('util');

const readFile = promisify(fs.readFile);

exports.makeTemplate = async (templateName) => {
  let templates = {};

  if (!templates[templateName]) {
    const file = await readFile('src/mails/' + templateName + '.html');
    templates[templateName] = Handlebars.compile(file.toString());
  }

  return templates[templateName];
};

exports.sendMail = async (templateName, data, options) => {
  let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: +process.env.MAIL_PORT,
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASSWORD
    },
    secure: +process.env.MAIL_PORT === 465
  });

  const template = await this.makeTemplate(templateName);
  data = JSON.parse(JSON.stringify(data));
  const html = template(data);

  transporter.sendMail(
    {
      html,
      from: {
        name: process.env.MAIL_FROM_NAME,
        address: process.env.MAIL_FROM
      },
      ...options
    },
    function (err, info) {
      if (err) {
        console.log(`send mail error: ${err}`);
      } else {
        console.log(`send mail success: ${info}`);
        console.log(`send mail success: ${info.response}`);
      }
    }
  );
};
