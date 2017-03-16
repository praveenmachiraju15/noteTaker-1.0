module.exports= function(app){

	app.get('/router',function(req,res){

		res.send("Hello, from the router page!");
	});
}