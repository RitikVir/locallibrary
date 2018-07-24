const {body,validationResult}=require('express-validator/check');
const{ sanitizeBody} = require('express-validator/filter');
var Genre =require('../models/genre.js');
var Book=require('../models/book');
var async=require('async');

exports.genre_list=function(req,res){

	Genre.find()
	.sort([['name','ascending']])
	.exec(function(err,list_genres){
		if(err) {return next(err);}
		res.render('genre_list',{title:'Genre List',genre_list:list_genres});
	});

};

exports.genre_detail=function(req,res,next){
	async.parallel({
		genre:function(callback){
			Genre.findById(req.params.id)
		    .exec(callback);
	     },
		genre_books:function(callback){
			Book.find({'genre':req.params.id})
			.exec(callback);
		},
     },function(err,results){
     	if(err){return next(err);}
     	if(results.genre==null){
     		var err=new Error('Genre not found');
     		err.status=404;
     		return next(err);
     	}
     	res.render('genre_detail',{title:'Genre List ',genre:results.genre,genre_books:results.genre_books});
     });

};

exports.genre_create_get=function(req,res){
	res.render('genre_form',{title:'Create Genre'});
};
exports.genre_create_post=[
	
	body('name','Genre name required').isLength({min:3}).trim(),
	sanitizeBody('name').trim().escape(),
	(req,res,next)=>{
		const errors =validationResult(req);
		
		var genre=new Genre(
		{
			name:req.body.name
		});
		if(!errors.isEmpty())
		{
			res.render('genre_form',{title:'Create Genre' ,genre:genre,errors:errors.array()});
			return ;
		}
		else
		{
			Genre.findOne({'name':req.body.name})
			.exec(function(err,found_genre){
				if(err){return next(err);}

				if(found_genre){
					res.redirect(found_genre.url);
				}
				else
				{
					genre.save(function(err){
						if(err) {return next(err);}
						res.redirect(genre.url);
					});
				}
			});
		}

	}

];

exports.genre_delete_get=function(req,res,next){
	async.parallel({
		genre:function(callback){
			Genre.findById(req.params.id).exec(callback)
		},
		genre_books:function(callback){
			Book.find({'genre':req.params.id}).exec(callback)
		},
		},function(err,results){
			if(err) { return next(err);}
			if(results.genre==null)
			{
				res.redirect('/catalog/genres');
			}
			res.render('genre_delete',{title:'Delete Genre',genre:results.genre,genre_books:results.genre_books});
		});
};
exports.genre_delete_post=function(req,res){
	async.parallel({
		genre:function(callback){
			Genre.findById(req.body.genreid).exec(callback)
		},
		genre_books:function(callback){
			Book.find({'genre':req.body.genreid}).exec(callback)
		},
	},function(err,results){
		if(err){ return next(err);}
		if(results.genre_books.length>0)
		{
			res.render('genre_delete',{title:'Delete Genre',genre:results.genre,genre_books:results.genre_books});
		}
		else
		{
			Genre.findByIdAndRemove(req.body.genreid,function(err){
				if(err){return next(err);}
				res.redirect('/catalog/genres')
			})
		}
	});
};

exports.genre_update_get=function(req,res){
	Genre.findById(req.params.id)
	.exec(function(err,results){
		if(err){ return next(err);}
		if(results==null){
			var err=new Error('Genre not found');
			err.status(404);
			return next(err);
		}
		res.render('genre_form',{title:'Update Genre',genre:results});
	})
};
exports.genre_update_post=[
	
	body('name','Name must be greater than two characters').isLength({min:3}).trim(),

	sanitizeBody('name').trim().escape(),

	(req,res,next)=>{
		const errors=validationResult(req);

		var genre = new Genre(
		{
			name:req.body.name,
			_id:req.params.id,
		});

		if(!errors.isEmpty())
		{
			res.render('genre_form',{title:'Update Genre',genre:genre,errors:errors.array()})
		}
		else
		{
			Genre.findByIdAndUpdate(req.params.id,genre,{},function(err,thegenre)
			{
				if(err) { return next(err);}
				res.redirect(thegenre.url);
			});
		}
	}

];
