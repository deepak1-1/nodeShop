const Product=require('../models/product');
const ITEMS_PER_PAGE=3;
let pagination={
	currentPage:1,
	totalPages:1,
	totalItems:0,
	products:[],
}
exports.getPaginatedPage=(req,next,callback)=>{
	let page=+req.query?.page;
	if(isNaN(page)){
		page=1;
	}
	Product.countDocuments()
	.then(count=>{
		Product.find().skip((page-1)*ITEMS_PER_PAGE).limit(ITEMS_PER_PAGE)
		.then(products=>{
			pagination.currentPage=page;
			pagination.totalPages=Math.ceil(count/ITEMS_PER_PAGE);
			pagination.totalItems=count;
			pagination.products=products;
			callback(pagination);
		})
	})
	.catch(err=>{
    return next(err);
	})
}
