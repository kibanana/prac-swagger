const mongoose = require('mongoose')
const ObjectId = require('mongoose').Types.ObjectId

const User = require('./user')

const reportSchema = mongoose.Schema({
  userId: { type: ObjectId, ref: 'User' },
  code: { type: Number },
  value: { type: String }, // value은 일단 기타(code: 4)에서만 사용
  createdAt: { type: Date, default: Date.now }
})
const commentSchema = mongoose.Schema({
  userId: { type: ObjectId, ref: 'User' },
  value: { type: String },
  commentReportMembers: [reportSchema], // 신고
  createdAt: { type: Date, default: Date.now }
})
const boardSchema = mongoose.Schema({
  userId: { type: ObjectId, ref: 'User'},
  title: { type: String, index: 'text' },
  body: { type: String },
  likeMembers: { type: [{ type: ObjectId, ref: 'User'}] }, // 좋아요
  reportMembers: [reportSchema], // 신고
  comments: [commentSchema],
  isDeleted: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
})

boardSchema.statics.createBoard = function (param) {
  const { userId, title, body } = param
  return this.create({ userId, title, body })
    .then((result) => result._id)
}

boardSchema.statics.findBoards = async function (searchString, sortKey) { // 어차피 없으면 undefined
  const aggregation = [
    { 
      $project: { 
        userId: true, 
        title: true, 
        createdAt: true, 
        likes: { $size: { $ifNull: ['$likeMembers', []] } },
        reports: { $size: { $ifNull: ['$reportMembers', []] } },
        isDeleted: { $ifNull: ['$isDeleted', false] }
      }
    },
    { 
      $match: {
        reports: { $lt: 2 },
        isDeleted: false
        // 신고 수가 2보다 작아야 한다, isDeleted가 false여야 한다(값이 없을 때를 고려해서)
      }
    }
  ]
  const sortCondition = { $sort: {} }
  switch (sortKey) {
    case 2: // 오래된순
      sortCondition.$sort.createdAt = 1
      break
    case 3: // 좋아요순
      sortCondition.$sort.likes = -1
      break
    case 1:
    default: // 최신순
      sortCondition.$sort.createdAt = -1
  }
  aggregation.push(sortCondition)
  if (searchString) { // searchString if문이 sortKey if문 앞에 있으면 좋아요순 처리할 때 $project 접근 힘듦
    aggregation.unshift({ $match: { $text: { $search: searchString } } },
      { $sort: { score: { $meta: "textScore" } } },)
  }
  const boards = await this.aggregate(aggregation)
  const boardMap = {}
  if (Array.isArray(boards)) {
    boards.forEach((elem) => {
      boardMap[elem._id] = elem
    })
  }
  const userIds = Object.values(boardMap)
    .map(elem => elem.userId)
    .filter(userId => String(userId).length == 24)
  if (userIds.length > 0) {
    const users = await User.find({ _id: { $in: userIds } }, { nickname: true })
    const filteredUserIds = users.map(elem => String(elem._id)) // userIds. nickname은 users에서 가져온다.
    const boardMapKeys = Object.keys(boardMap)
    boardMapKeys.forEach(key => {
      const usernameIdx = filteredUserIds.indexOf(String(boardMap[key].userId))
      if (usernameIdx === -1) {
        boardMap[key]['username'] = null
      }
      else {
        boardMap[key]['username'] = users[usernameIdx].nickname
      }
    })
  }
  return Object.values(boardMap)
}

boardSchema.statics.findBoard = async function (id) {
  let board = await this.aggregate([
    {
      $match: {
        _id: ObjectId(id)
      }
    },
    { 
      $project: {
        userId: true, 
        title: true, 
        body: true, 
        createdAt: true,
        // likes: { $size: { $ifNull: ['$likeMembers', []] } },
        // reports: { $size: { $ifNull: ['$reportMembers', []] } },
        likes: { $ifNull: ['$likeMembers', []] },
        reports: { $ifNull: ['$reportMembers', []] },
        comments: {
          _id: true,
          userId: true,
          value: true,
          commentReportMembers: {
            _id: true,
            userId: true,
            code: true,
            value: { $ifNull: ['$value', '']},
            createdAt: true
            // $cond: {
            //   if: { $isArray: '$commentReportMembers' },
            //   then: 'commentReportMembers',
            //   else: []
            // }
          },
          // commentReportMembers: true, // 이것만 하면 값이 배열이 아닐 때 아래 for문에서 에러 발생
          createdAt: true
        }
        // comments: {
        //   $map: {
        //     'input': '$comments',
        //     'as': 'c',
        //     'in': {
        //       _id: '$$c._id',
        //       userId: '$$c.userId',
        //       value: '$$c.value',
        //       commentReports: { $size: '$$c.commentReportMembers' },
        //       createdAt: '$$c.createdAt'
        //     }
        //   }
        // }
      }
    },
  ])
  board = board[0]
  const userId = board.userId && String(board.userId).length == 24 ? String(board.userId) : ''
  let user = null
  if (userId) {
    const result = await User.findOne({ _id: userId }, { nickname: true })
    if (result) user = { username: result.nickname }
  }
  board = Object.assign(board, user || {})

  const commentMap = {}
  if (Array.isArray(board.comments)) {
    board.comments.forEach((elem) => {
      commentMap[elem._id] = elem
    })
  }
  const commentUserIds = Object.values(commentMap)
    .map(elem => elem.userId)
    .filter(userId => String(userId).length == 24)
  if (commentUserIds.length > 0) {
    const users = await User.find({ _id: { $in: commentUserIds } }, { nickname: true })
    const filteredUserIds = users.map(elem => String(elem._id)) // userIds. nickname은 users에서 가져온다.
    const commentMapKeys = Object.keys(commentMap)
    commentMapKeys.forEach(key => {
      const usernameIdx = filteredUserIds.indexOf(String(commentMap[key].userId))
      if (usernameIdx === -1) {
        commentMap[key]['username'] = null
      }
      else {
        commentMap[key]['username'] = users[usernameIdx].nickname
      }
    })
  }
  board.comments = Object.values(commentMap)
  return board
}

boardSchema.statics.updateBoard = function (param) { // userId는 JWT에서
  const { id, userId, title, body } = param
  const updateQuery = { }
  if (title) updateQuery.title = title
  if (body) updateQuery.body = body

  return this.updateOne({ _id: id, userId }, updateQuery)
}

boardSchema.statics.deleteBoard = function (id, userId) { // userId는 JWT에서
  return this.updateOne({ _id: id, userId }, { isDeleted: true })
}

boardSchema.statics.addLikeMember = function (id, userId) {
  // this.updateOne({ _id: id }, { $addToSet: { likeMembers: ObjectId(userId) } })
  // addToSet을 사용하면 따로 체크할 필요 없다
  return this.updateOne({
    _id: id, 
    likeMembers: { $ne: ObjectId(userId) },
  }, {
    $push: { likeMembers: ObjectId(userId) } 
  })
}

boardSchema.statics.removeLikeMember = function (id, userId) {
  return this.updateOne({
    _id: id, 
    likeMembers: { $eq: ObjectId(userId) },
  }, {
    $pull: { likeMembers: ObjectId(userId) } 
  })
}

boardSchema.statics.addReportMember = function (param) {
  const { id, userId, code, value } = param
  const pushQuery = {
    userId: ObjectId(userId), code
  }
  if (value) {
    pushQuery.value = value
  }
  return this.updateOne({
    _id: id,
    reportMembers: { $not: { $elemMatch: { userId: ObjectId(userId)} } },
  }, {
    $push: { reportMembers: pushQuery }
  })
}

boardSchema.statics.addComment = function (param) {
  const { boardId, userId, value } = param
	return this.updateOne({ 
    _id: boardId
  }, {
		$push: {
			comments: { userId, value }
		}
	})
}

boardSchema.statics.updateComment = function (param) {
  const { boardId, commentId, userId, value } = param
	return this.updateOne({ 
    _id: ObjectId(boardId),
    comments: {
      $elemMatch: {
        _id: ObjectId(commentId),
        userId: ObjectId(userId)
      }
    }
	}, {
		$set: { 'comments.$.value': value }
	})
}

boardSchema.statics.deleteComment = function (param) {
  const { boardId, commentId, userId } = param
	return this.updateOne({
    _id: ObjectId(boardId),
    'comments.userId': ObjectId(userId),
	}, { 
		$pull: { comments: { _id: ObjectId(commentId) } }
	})
}

boardSchema.statics.addCommentReportMember = function (param) {
  const { boardId, commentId, userId, code, value } = param
	const pushQuery = {
		userId: ObjectId(userId), code
	}
	if (value) {
    pushQuery.value = value
  }
  return this.updateOne({
    _id: ObjectId(boardId),
    'comments._id': ObjectId(commentId),
    // 'comments.commentReportMembers': { $not: { $elemMatch: { userId: ObjectId(userId) } } } // 이게 있으면 한 댓글에 신고한 기록이 있을 때 다른 댓글을 신고할 수 없게 된다.
  }, {
    $push: {
			"comments.$.commentReportMembers": pushQuery
		}
  })
}

boardSchema.statics.analyzeBoard = async function () {
  // Board의 boardCnt, likeCnt
  // User의 nickname
  // Board에 각각 있는 userId가 User의 _id에 대응된다. (N : 1)

  const userMap = {}
  const boards = await this.aggregate([
    {
      $group: {
        _id: '$userId',
        boardCnt: { $sum: 1 },
        likeCnt: { $sum: { $size: '$likeMembers' } }
      }
    },
    {
      $project: {
        boardCnt: true,
        likeCnt: true
      }
    }, {
      $sort: {
        boardCnt: -1,
        likeCnt: -1
      }
    }
  ])
  if (Array.isArray(boards)) {
    boards.forEach((elem) => {
      userMap[elem._id] = {
        boardCnt: elem.boardCnt,
        likeCnt: elem.likeCnt
      }
    })
  }

  // 숫자 세고 board의 userId 갖고오는 것까지는 aggregate
  // const boards = await this.find({}, { _id: true, userId: true, likeMembers: true })
  // if (!boards) return null
  
  // const userMap = {}
  // if (Array.isArray(boards)) {
  //   boards.forEach((elem) => {
  //     userMap[elem.userId] = userMap[elem.userId] || { boardCnt: 0, likeCnt: 0 }
  //     userMap[elem.userId] = {
  //       boardCnt: userMap[elem.userId].boardCnt + 1,
  //       likeCnt: userMap[elem.userId].likeCnt + elem.likeMembers.length
  //     }
  //   })
  // }

  const userKeys = Object.keys(userMap).filter(userId => userId.length == 24)
  if (userKeys.length > 0) {
    const users = await User.find({ _id: { $in: userKeys } }, { nickname: true }) 
    // 게시글을 작성한 회원의 이름만
    users.forEach(user => { userMap[String(user._id)]['username'] = user.nickname })
  }
  return Object.values(userMap)
}

module.exports = mongoose.model('Board', boardSchema)
