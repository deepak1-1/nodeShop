const User = require('../models/user');
const bcrypt = require('bcryptjs')
const crypto = require('crypto')
const { validationResult } = require('express-validator/check')
exports.getLogin = (req, res, next) => {
  // console.log(req?.session);
  res.render('auth/login', {
    path: '/login',
    pageTitle: 'Login',
    isAuthenticated: false,
    error: req.flash("error")[0]?.toString(),
    oldInput: {
      email: "",
      password: "",
    }
  });
};

exports.getSignup = (req, res, next) => {
  console.log(req.flash("error")[0]?.toString())
  res.render('auth/signup', {
    path: '/signup',
    pageTitle: 'Signup',
    isAuthenticated: false,
    error: req.flash('error')[0]?.toString(),
    oldInput: {
      email: "",
      password: "",
      confirmPassword: "",
    },
    errors: [],
  });
};

exports.postLogin = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errList = validationResult(req);
  if (errList.array().length !== 0) {
    return res.status(422).render('auth/login', {
      path: '/login',
      pageTitle: 'Login',
      isAuthenticated: false,
      error: errList.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
      }
    })
  }
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash("error", "User with given email and password do not exist!");
        return res.redirect('/login');
      } else {
        bcrypt.compare(password, user.password)
          .then(isCorrect => {
            if (isCorrect) {
              req.session.user = user;
              req.session.isLoggedIn = true;
              return req.session.save(err => {
                console.error(err);
                res.redirect('/');
              })
            } else {
              req.flash("error", "User with given email and password do not exist!");
              return res.redirect('/login');
            }
          })
      }
    })
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  const errList = validationResult(req);
  if (!errList.isEmpty()) {
    return res.status(422).render('auth/signup', {
      path: '/signup',
      pageTitle: 'Signup',
      isAuthenticated: false,
      error: errList.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword: req.body.confirmPassword,
      },
      errors: errList.array()
    })
  }

  bcrypt.hash(password, 12)
    .then(hashedPassword => {
      const user = new User({
        email: email,
        password: hashedPassword,
        cart: { items: [], },
      })
      return user.save();
    })
    .then(() => {
      res.redirect("/login");
    })
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postLogout = (req, res, next) => {
  req.session.destroy(err => {
    if(err){
			return next(err);
		}else{
			res.redirect('/');
		}
  });
};


exports.getReset = (req, res, next) => {
  res.render('auth/reset', {
    path: '/reset',
    pageTitle: 'Reset Password',
    isAuthenticated: false,
    error: req.flash("error")[0]?.toString(),
  });
}

exports.postReset = (req, res, next) => {
  const email = req.body.email;
  User.findOne({ email: email })
    .then(user => {
      if (!user) {
        req.flash("error", "Email ID doesn't exist!");
        return res.redirect('/reset');
      } else {
        crypto.randomBytes(32, (err, buffer) => {
          if (err) {
            console.error(err);
            return;
          }
          const token = buffer.toString('hex');
          user.resetToken = token;
          user.resetTokenExpiry = new Date().getTime() + 3600000;
          user.save()
            .then(result => {
              // res.redirect('/');
              /* send email to user specifying the link to reset the password */
              res.redirect(`/update/${token}`)
            })
            .catch(err => {
              const error = new Error(err);
              return next(error);
            });
        })
      }
    })
}

exports.getUpdate = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenExpiry: { $gt: new Date().getTime() } })
    .then(user => {
      if (user) {
        res.render('auth/update', {
          path: '/update',
          pageTitle: 'Update Password',
          isAuthenticated: false,
          error: req.flash("error")[0]?.toString(),
          userID: user._id.toString(),
          token: token,
        });
      } else {
        res.redirect('/reset')
      }
    })
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
}
exports.postUpdate = (req, res, next) => {
  const { newPassword, retypeNewPassword, userID, token } = req.body;
  User.findOne({ _id: userID, resetToken: token, resetTokenExpiry: { $gt: new Date().getTime() } })
    .then(user => {
      if (!user) {
        return res.redirect('/reset');
      }
      bcrypt.hash(newPassword, 12)
        .then(hashedPassword => {
          user.password = hashedPassword;
          user.resetToken = undefined;
          user.resetTokenExpiry = undefined;
          return user.save()
        })
        .then(result => {
          res.redirect('/login')
        })
    })
    .catch(err => {
      const error = new Error(err);
      return next(error);
    });
}