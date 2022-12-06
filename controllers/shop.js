const Product = require("../models/product");
const Order = require("../models/order");
const path = require("path");
const fs = require("fs");
const pdfDocument = require("pdfkit");
const { createInvoice } = require("../util/createInvoice");
const { getPaginatedPage } = require("./paginationHelper");
const stripe = require("stripe")(process.env.STRIPE_KEY);

exports.getProducts = (req, res, next) => {
  getPaginatedPage(req, next, (pagination) => {
    return res.render("shop/product-list", {
      prods: pagination.products,
      pageTitle: "All Products",
      path: `/products/?page=${req.query.page}`,
      currentPage: pagination.currentPage,
      hasPreviousPage: pagination.currentPage !== 1,
      previousPage: pagination.currentPage - 1,
      hasNextPage: pagination.currentPage !== pagination.totalPages,
      nextPage: pagination.currentPage + 1,
      lastPage: pagination.totalPages,
    });
  });

  // Product.findById();
  // Product.find()
  //   .then((products) => {
  //     // console.log(products);
  //     res.render("shop/product-list", {
  //       prods: products,
  //       pageTitle: "All Products",
  //       path: "/products",
  //     });
  //   })
  //   .catch((err) => {
  //     const error = new Error(err);
  //     return next(error);
  //   });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};
exports.getIndex = (req, res, next) => {
  getPaginatedPage(req, next, (pagination, err) => {
    if (err) {
      throw err;
    }
    return res.render("shop/index", {
      prods: pagination.products,
      pageTitle: "Shop",
      path: `?page=${req.query.page}`,
      currentPage: pagination.currentPage,
      hasPreviousPage: pagination.currentPage !== 1,
      previousPage: pagination.currentPage - 1,
      hasNextPage: pagination.currentPage !== pagination.totalPages,
      nextPage: pagination.currentPage + 1,
      lastPage: pagination.totalPages,
    });
  });
  // Product.find()
  //   .then((products) => {
  //     res.render("shop/index", {
  //       prods: products,
  //       pageTitle: "Shop",
  //       path: "/",
  //     });
  //   })
  //   .catch((err) => {
  //     const error = new Error(err);
  //     return next(error);
  //   });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items;
      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Your Cart",
        products: products,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  console.log(req.user);
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      console.log(result);
      res.redirect("/cart");
    });
};

exports.postCartDeleteProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.postOrder = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.getInvoice = (req, res, next) => {
  const orderID = req.params.orderID;
  Order.findById(orderID)
    .then((order) => {
      if (!order || order.user.userId.toString() !== req.user._id.toString()) {
        return next("Order not found!");
      } else {
        const invoiceName = "invoice-" + orderID + ".pdf";
        const filePath = path.join("data", "invoices", invoiceName);
        let subtotal = 0;
        const items = order.products.map((product) => {
          subtotal += product.quantity * product.product.price;
          return {
            item: product.product.title,
            description: product.product.description,
            quantity: product.quantity,
            amount: product.product.price,
          };
        });
        const invoice = {
          shipping: {
            name: "dummy name",
            address: "dummy address",
            city: "dummy city",
            state: "dummy state",
            country: "dummy country",
            postal_code: 123456,
          },
          items,
          subtotal: subtotal,
          paid: subtotal,
          invoice_nr: order._id,
        };

        res.setHeader("Content-Type", "application/pdf");
        res.setHeader("Content-Disposition", `inline	;filename=${invoiceName}`);
        createInvoice(invoice, filePath, res);
        // const pdfDoc = new pdfDocument();
        //   res.setHeader("Content-Type", "application/pdf");
        //   res.setHeader(
        //     "Content-Disposition",
        //     `attachment;filename=${invoiceName}`
        //   );
        // pdfDoc.pipe(fs.createWriteStream(filePath));
        // pdfDoc.pipe(res);
        // pdfDoc.text("HELLO WORLD!", { align: "center", underline: true });
        // pdfDoc.end();

        // fs.readFile(filePath, (err, data) => {
        //   if (err) {
        //     return next(err);
        //   }
        //   res.setHeader("Content-Type", "application/pdf");
        //   res.setHeader(
        //     "Content-Disposition",
        //     `attachment;filename=${invoiceName}`
        //   );
        //   res.send(data);
        // });
        // const file = fs.createReadStream(filePath);
        // file.on("error", (err) => {
        //   return next(err);
        // });
        // res.setHeader("Content-Type", "application/pdf");
        // res.setHeader(
        //   "Content-Disposition",
        //   `attachment;filename=${invoiceName}`
        // );
        // // res is writable stream so we can pipe into it
        // file.pipe(res);
      }
    })
    .catch((err) => {
      return next(err);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let totalAmount = 0;
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      products = user.cart.items;
      products.forEach((product) => {
        totalAmount += product.quantity * product.productId.price;
      });
      return stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: products.map((p) => {
          return {
            name: p.productId.title,
            description: p.productId.description,
            amount: p.productId.price * 100,
            currency: "inr",
            quantity: p.quantity,
          };
        }),
        success_url:
          req.protocol + "://" + req.get("host") + "/checkout/success", // => http://localhost:3000
        cancel_url: req.protocol + "://" + req.get("host") + "/checkout/cancel",
      });
    })
    .then((session) => {
      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products: products,
        totalAmount,
        sessionId: session.id,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};

exports.getCheckoutSuccess = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .execPopulate()
    .then((user) => {
      const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
      });
      const order = new Order({
        user: {
          email: req.user.email,
          userId: req.user,
        },
        products: products,
      });
      return order.save();
    })
    .then((result) => {
      return req.user.clearCart();
    })
    .then(() => {
      res.redirect("/orders");
    })
    .catch((err) => {
      const error = new Error(err);
      return next(error);
    });
};
