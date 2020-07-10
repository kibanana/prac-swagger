const nodemailer = require('nodemailer')
const path = require('path')
require('dotenv').config()

const email = process.env.EMAIL
const pwd = process.env.PASSWORD

const transportOptions = {
  // pool: true,
  // secure: true,
  service: 'Gmail',
  host :'smtp.gmail.com',
  secure: false,
  auth: {
    user: email,
    pass: pwd
  }
}
const transporter = nodemailer.createTransport(transportOptions)

const getMessageOptions = (useremail, subject) => { // options
  return {
    from: email,
    to: useremail,
    envelope: {
      from: `fromKYW <${email}>`,
      to: `toKYW <${useremail}>`,
    },
    subject
  }
}

const getMessageHtml = (pick, param) => { // html
  const { useremail, code } = param 
  // 1: signup(+ image), 2: password
  switch (pick) {
    case 1:
      const imagePath = path.join(__dirname, '..', 'milk.gif')
      return {
        html: `<a href="http://127.0.0.1:3000/api/auth/sign-up/verify?email=${useremail}&code=${code}" target="_blank">Click Me!</a><br><br><br> <img src="cid:milk"/>`,
        attachments: [{
          filename: 'milk.gif',
          path: imagePath,
          cid: 'milk'
        }]
      }
    case 2:
      return {
        html: `<a href="http://127.0.0.1:3000/api/users/findpassword?code=${code}" target="_blank">Click Me!</a><br><br><br>`
      }
  }
}

const sendSignUpEmailVerify = (useremail, code) => {
  const messageOptions = { 
    ...getMessageOptions(useremail, 'test: 회원가입하려면 이메일 인증해주세요!'), 
    ...getMessageHtml(1, { useremail, code }) 
  }
  return transporter.sendMail(messageOptions)
}

const sendFindPasswordEmail = (useremail, code) => {
  const messageOptions = { 
    ...getMessageOptions(useremail, 'test: 비밀번호 찾기'), 
    ...getMessageHtml(2, { useremail, code }) 
  }
  return transporter.sendMail(messageOptions)
}

module.exports = {
  sendSignUpEmailVerify,
  sendFindPasswordEmail
}
