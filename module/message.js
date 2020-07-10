class Message {
  constructor (_message) {
    this.message = _message
  }
}

// Status Code '200'
class SuccessMessage extends Message {
  constructor (_data) {
    super('success')
    this.data = _data
  }
}

// Status Code 4XX
class FailedMessage extends Message {
  constructor (obj) {
    super('failed')
    this.err_code = obj.MESSAGE
    this.description = obj.DESCRIPTION
  }
}

// Status Code 500
class InternalErrorMessage extends Message {
  constructor () {
    super('internal server error')
  }
}

module.exports = {
  Message,
  SuccessMessage,
  FailedMessage,
  InternalErrorMessage
}
