const {body,validationResult}=require('express-validator/check');
const {sanitizeBody}=require('express-validator/filter');
var BookInstance =require('../models/bookinstance.js');
var Book=require('../models/book.js');	
var async=require('async');
exports.bookinstance_list=function(req,res,next){
  BookInstance.find().
	populate('book').
	exec(function(err,list_bookinstances){
		if(err) {return next(err);	}
		res.render('bookinstance_list',{title:'Book Instance List',bookinstance_list:list_bookinstances});
	});  
};

exports.bookinstance_detail=function(req,res,next){
	BookInstance.findById(req.params.id)
	.populate('book')
	.exec(function(err,bookinstance){
		if(err){ return next(err);}
		if(bookinstance==null){
			var error =new Error('Book copy not found');
			err.status=404;
			return next(err);
		}
		res.render('bookinstance_detail',{title:'Book :' ,bookinstance : bookinstance});
	})

};

exports.bookinstance_create_get=function(req,res){
	Book.find({},'title')
	.exec(function(err,books){
		if(err){return next(err);}

		res.render('bookinstance_form',{title:'Create BookInstance',book_list:books});
	});
};
exports.bookinstance_create_post=[
	body('book','Book must be specified').isLength({min:1}).trim(),
	body('imprint','Imprint must be specified').isLength({min:1}).trim(),
	body('due_back','Invalid date').optional({checkFalsy:true}).isISO8601(),

	sanitizeBody('book').trim().escape(),
	sanitizeBody('imprint').trim().escape(),
	sanitizeBody('status').trim().escape(),
	sanitizeBody('due_back').toDate(),

	(req,res,next)=>{

		const errors=validationResult(req);

		var bookinstance=new BookInstance(
		{
			book:req.body.book,
			imprint:req.body.imprint,
			status:req.body.status,
			due_back:req.body.due_back
		});

		if(!errors.isEmpty())
		{
			Book.find({},'title')
			.exec(function(err,books){		
				if(err){return next(err);}

				res.render('bookinstance_form',{title:'Create BookInstance',book_list:books,bookinstance:bookinstance,selected_book:bookinstance.book._id,errors:errors.array()});	

			});
			return ;
		}
		else
		{	
			bookinstance.save(function(err){
				if(err){return next(err);}
				res.redirect(bookinstance.url);
			});
		}
	}



];

exports.bookinstance_delete_get=function(req,res){
	BookInstance.findById(req.params.id).exec(function(err,bookinstance){
		if(err) {return next(err);}
		if(bookinstance==null){
			res.redirect('/catalog/bookinstances');
		}

		res.render('bookinstance_delete',{title:'Delete BookInstance :',bookinstance:bookinstance})
	});

};
exports.bookinstance_delete_post=function(req,res){
	BookInstance.findById(req.body.bookinstanceid).exec(function(err,results){
		if(err) {return next(err);}
		

		BookInstance.findByIdAndRemove(req.body.bookinstanceid,function deleteBookInstance(err){
			if(err){return next(err);}
			res.redirect('/catalog/bookinstances');
		})
	});

};

exports.bookinstance_update_get=function(req,res,next){
	async.parallel({
		bookinstance:function(callback){
			BookInstance.findById(req.params.id).populate('book').exec(callback);
		},
		books:function(callback){
			Book.find(callback);
		},
	},function(err,results){
		if(err){ return next(err);}
		if(results.bookinstance==null){
			var error=new Error('Book copy not found');
			error.status('404');
			return next(error);
		}
		
		for(let i=0;i<results.books.length;i++)
		{
			if(results.books[i]._id.toString()==results.bookinstance.book._id.toString())
			{
				results.books[i].checked='true';
			}
		}
		
		res.render('bookinstance_form',{title:'Update BookInstance',bookinstance:results.bookinstance,selected_book : results.bookinstance.book._id,book_list:results.books});
	});


};
exports.bookinstance_update_post=[

	body('book','Book must be specified').isLength({min:1}).trim(),
	body('imprint','Imprint must be specified').isLength({min:1}).trim(),
	body('due_back','Invalid date').optional({checkFalsy:true}).isISO8601(),

	sanitizeBody('book').trim().escape(),
	sanitizeBody('imprint').trim().escape(),
	sanitizeBody('due_back').toDate(),


	(req,res,next)=>{
		const errors=validationResult(req);
		var bookinstance=new BookInstance(
		{
			book:req.body.book,
			imprint:req.body.imprint,
			status:req.body.status,
			due_back:req.body.due_back,
			_id:req.params.id,

		});

		if(!errors.isEmpty())
		{
			console.log('@@@@@@@@');
			console.log(bookinstance.status);
			Book.find({})
			.exec(function(err,books){
				if(err){ return next(err);}
				res.render('bookinstance_form',{title:'Update BookInstance',bookinstance:bookinstance,book_list:books,errors:errors.array(),selected_book:bookinstance.book._id});
			});

		}
		else
		{
			BookInstance.findByIdAndUpdate(req.params.id,bookinstance,{},function(err,thebookinstance){
				if(err){ return next(err);}
				res.redirect(thebookinstance.url);
			});
		}


	}
];

