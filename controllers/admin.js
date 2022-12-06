const Product = require("../models/product");
const { validationResult } = require("express-validator/check");
const fs = require("fs");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    oldInput: {
      title: "",
      price: "",
      description: "",
    },
    error: null,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const imageUrl = req.file?.path;
  const price = req.body.price;
  const description = req.body.description;
  const errList = validationResult(req);
  if (!req.file || !errList.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      oldInput: {
        title: req.body.title,
        price: req.body.price,
        description: req.body.description,
      },
      error: !req.file ? "Please provide an image" : errList.array()[0].msg,
    });
  }

  const product = new Product({
    title: title,
    price: price,
    description: description,
    imageUrl: imageUrl,
    userId: req.user,
  });
  product
    .save()
    .then((result) => {
      // console.log(result);
      console.log("Created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  // Product.findById(prodId)
  Product.findOne({ _id: prodId, userId: req.session.user._id })
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      console.log(product);
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        oldInput: product,
        error: null,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedPrice = req.body.price;
  const updatedImageUrl = req.file?.path;
  const updatedDesc = req.body.description;
  const errList = validationResult(req);
  if (errList.array().length > 0) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: `/admin/edit-product/${prodId}`,
      editing: editMode,
      oldInput: {
        _id: prodId,
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
      },
      error: errList.array()[0].msg,
    });
  }
  // Product.findById(prodId)
  Product.findOne({ _id: prodId, userId: req.session.user._id })
    .then((product) => {
      product.title = updatedTitle;
      product.price = updatedPrice;
      product.description = updatedDesc;
      if (updatedImageUrl) {
        fs.unlink(product.imageUrl, (err) => {
          if (err) {
            return next(err);
          }
        });
        product.imageUrl = updatedImageUrl;
      }
      return product.save();
    })
    .then((result) => {
      console.log("UPDATED PRODUCT!");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find({ userId: req.session.user._id })
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  // Product.findByIdAndRemove(prodId)
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return next("Product not found!");
      }
      fs.unlink(product.imageUrl, (err) => {});
      return product.remove();
      // Product.findOneAndRemove({ _id: prodId, userId: req.session.user._id })
      //   .then(() => {
      //     console.log("DESTROYED PRODUCT");
      //     res.redirect("/admin/products");
      //   })
      //   .catch((err) => {
      //     const error = new Error(err);
      //     return next(error);
      //   });
    })
    .then((result) => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      return next(err);
    });
};

exports.deleteProduct = (req, res, next) => {
  const prodId = req.params.productID;
  Product.findById(prodId)
    .then((product) => {
      fs.unlink(product.imageUrl, (err) => {
        if (err) {
          res.status(500).json({ message: "Product deletion failed!" });
        }
      });
      return product.remove();
    })
    .then((result) => {
      res.status(200).json({ message: "Product deleted succesfully!" });
    })
    .catch((err) => {
      res.status(500).json({ message: "Product deletion failed!" });
    });
};
