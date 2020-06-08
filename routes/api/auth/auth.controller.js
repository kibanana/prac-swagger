const jwt = require('jsonwebtoken')

const User = require('../../../model/user')
const message = require('../../../module/message')
const { TOKEN_KEY, TOKEN_OPTIONS } = require('../../../config')
const { FailedMessageObj } = require('../../../module/constants')

const { SuccessMessage, FailedMessage, InternalErrorMessage } = message

exports.SignUp = async (req, res) => {
  try {
    const { email, password, nickname, address, birthDay } = req.body
    if (!(email && password && nickname && address && birthDay)) {
      return res.status(400).send(new FailedMessage(FailedMessageObj.INVALID_PARAM))
    }
    if (await User.chkExistsEmail(email)) return res.status(400).send(new FailedMessage(FailedMessageObj.EXIST_EMAIL))
    if (await User.chkExistsNickname(nickname)) return res.status(400).send(new FailedMessage(FailedMessageObj.EXIST_NICKNAME))
    await User.signUp({ email, password, nickname, address, birthDay })
    res.send(new SuccessMessage())
  } 
  catch (err) {
    console.log(err)
    res.status(500).send(new InternalErrorMessage())
  }
}

exports.SignIn = (req, res) => {
  try {
    if (req.user.err) throw new Error(req.user.err)

    const token = jwt.sign({ _id: req.user._id }, TOKEN_KEY, TOKEN_OPTIONS)
    res.send(new SuccessMessage({ token }))
  } 
  catch (err) {
    console.log(err)
    res.status(500).send(new InternalErrorMessage())
  }
}

exports.SignInFailed = (req, res) => {
  res.status(400).send(new FailedMessage(FailedMessageObj.INVALID_EMAIL_PWD))
}

// 토큰이 정상적으로 발급되고 유지됐는지 검사한다.
// passport-jwt을 도입함으로써 JwtVeirfy는 성공 메세지 날려주는 역할만 하게 됐다.
exports.JwtVerify = (req, res) => {
  res.send(new SuccessMessage())
}
