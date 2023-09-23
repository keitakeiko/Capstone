const adminController = {
  adminGetUsers: (req, res) => {
    return res.render('users/admin')
  }
}

module.exports = adminController