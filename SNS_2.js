var express = require('express');
var mysql = require('mysql');
var alert = require('alert-node');
var multer = require('multer');
var PythonShell = require('python-shell');
var fs = require('fs');
var moment = require('moment');
var play = require('play');
var bodyParser = require('body-parser');
var async = require('async');
const vision = require('node-cloud-vision-api');
vision.init({auth: 'AIzaSyCGswfWrQc3a6TQ7K4rlNZlcgrvef07ves'})


var connection = mysql.createConnection({
    host: 'nupdoung.czrococc8bvl.ap-northeast-2.rds.amazonaws.com',
    port: '3306',
    user: 'root',
    password: '12345678',
    database: 'new_schema',
    debug: false
});

var storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        cb(null, file.originalname);
    }
});


var upload = multer({storage: storage});

var options = {
    mode: 'text',
    pythonPath: '',
    pythonOptions: [],
    scriptPath: '',
    args: []
}
///usr/bin/python3.6

var router = express.Router();
router.route('/first').get(function(req, res){
    res.render('layout2-result.html');
});

var id;
var password;
var phone;
var name;
var login_ID;
var login_password;
var profile_img;
var post_img;
var post_music;

router.route('/first').post(function(req,res){
    
    id = req.body.join_id;
    password = req.body.join_password;
    phone = req.body.phone;
    name = req.body.name;
    
    console.log(id);
    
    console.log(password);
    console.log(name);
    console.log(phone);
    
    var id_size = id.length;
    var id_dup = 0;
    var password_size = password.length;
    var phone_size = phone.length;
    var name_size = name.length;
 
    var sqlQuery = "INSERT INTO persons SET ?";
    var post = {id: id, password: password, phone: phone, name: name};
    
    async.waterfall([
        function(callback){
            console.log(1);
            connection.query('SELECT id from persons', function(err, rows, fields){
                if (!err){
                    for(var i = 0; i < rows.length; i++)
                    {
                        if(rows[i].id == id){
                            id_dup = 1;
                            
                    
                        }
                    }
                    callback(null, id_dup);
                }
                else
                    console.log('Error while performing Query.', err);
            });
        },
        function(id_dup, callback){
            console.log(2);
            console.log(id_dup);
            if((id_size > 10) || (id_size == 0) || (password_size < 7) || (password_size == 0) || (phone_size != 13) || (phone_size == 0) || (name_size == 0)){
                res.write('<script>alert("Please retry sign in. You entered inappropriate information")</script>');
                res.write('<script language=\"javascript\">window.location=\"http://127.0.0.1:5001/first\"</script>');
            }
            else{
                if(id_dup == 1){
                    res.write('<script>alert("There is already same ID.")</script>');
                    res.write('<script language=\"javascript\">window.location=\"http://127.0.0.1:5001/first\"</script>');
                }
                else{
                    var query = connection.query(sqlQuery, post, callback);
                    console.log("Insert Complete!");
                    res.write('<script>alert("Sign in success.")</script>');
                    res.write('<script language=\"javascript\">window.location=\"http://127.0.0.1:5001/first\"</script>'); 
                }
            }
            
        }
        
    ]);
    
    
    function callback(err, result){
        if(err){
            //throw err
            console.log("error");
        }
    }
});

router.route('/login').get(function(req, res){
    res.render('viewProfile.html');
});

router.route('/login').post(function(req,res){
    
    login_ID = req.body.login_id;
    login_password = req.body.login_password;
    
    console.log(login_ID);
    console.log(login_password);
    
    var login = 0;
    connection.query('SELECT * from persons', function(err, rows, fields){
    if (!err){
        for(var i = 0; i < rows.length; i++)
        {
            if((rows[i].id == login_ID) && (rows[i].password == login_password)){
                login = 1;
                var path = "/uploads/" + rows[i].profile_img;
                profile_img = rows[i].profile_img;
                res.render('viewProfile.html',{login_ID : login_ID, profile_img : path, post_img : post_img});
                
            }
        }
        if(login == 0){
            res.write('<script>alert("Please log in again or sign in.")</script>');
            res.write('<script language=\"javascript\">window.location=\"http://127.0.0.1:5001/first\"</script>');
        }
    }
    else
        console.log('Error while performing Query.', err);

    });
});



router.route('/profile').post(upload.array('photo',1), function(req,res){
    var files = req.files;
    console.dir(req.files[0]);
    profile_img = files[0].originalname;
    var path = "/uploads/" + profile_img;
    
    var sqlQuery = "UPDATE persons set profile_img = '" + profile_img+ "' where id = '" + login_ID + "';";
    
    function callback(err, result){
    if(err){
        throw err
    }
    alert('프로필 이미지 업로드 완료.');
    res.render('viewProfile.html',{login_ID : login_ID, profile_img: path, post_img : post_img});
    }
    
    var query = connection.query(sqlQuery, callback);
    
});

router.route('/post').post(upload.array('photo',1), function(req,res){
    var files;
    var arr = [];
    var face = 0;
    var happiness = 0;
    var sadness = 0;
    var anger = 0;
    var season;
    var post_music;
    var date;
    var month;
    
    
    async.waterfall([
        function(callback){
            files = req.files;
            post_img = files[0].originalname;

            var input = fs.createReadStream('./uploads/' + post_img); 
            var output = fs.createWriteStream('./uploads/temp.jpg'); 
            input.pipe(output); 
            callback(null, post_img);
            
        },
        function(post_img, callback){

            var request = new vision.Request({
              image: new vision.Image('./uploads/'+post_img),
              features: [
                new vision.Feature('FACE_DETECTION', 10),
              ]
            })
            console.log(request);

            // send single request
            vision.annotate(request).then((res) => {
              // handling response
               
                    var result = JSON.stringify(res.responses);
                    console.log(result);
                    result = result.split(":");

                    callback(null, result);
                
            
            }, (e) => {
              console.log('Error: ', e);
            })  
        },
        function(result, callback){
                if(result.length == 1){
                                PythonShell.run('image_repackage.py', options, function(err, results){
                                    if(err) throw err;
                                    PythonShell.run('neural_network.py', options, function(err, results){
                                        if(err) throw err;
                                        arr = results[0].split(',');
                                        user_emotion = arr[4];
                                        callback(null, user_emotion);
                                    });
                                });

                }
            else{
                    for(var i = (result.length-1); i > (result.length-10); i--){
                        console.log(i);
                        if(result[i].includes('joyLikelihood')){
                            if(result[i+1].includes('VERY_LIKELY')){
                                happiness = 6;
                            }
                            else if(result[i+1].includes('POSSIBLE')){
                                happiness = 4;
                            }
                            else if(result[i+1].includes('VERY_UNLIKELY')){
                                happiness = 2;
                            }
                            else if(result[i+1].includes('UNLIKELY')){
                                happiness = 3;
                            }
                            else if(result[i+1].includes('UNKNOWN')){
                                happiness = 1;
                            }
                            else if(result[i+1].includes('LIKELY')){
                                happiness = 5;
                            }
                        }
                        if(result[i].includes('sorrowLikelihood')){
                            if(result[i+1].includes('VERY_LIKELY')){
                                sadness = 6;
                            }
                            
                            else if(result[i+1].includes('POSSIBLE')){
                                sadness = 4;
                            }
                           
                            else if(result[i+1].includes('VERY_UNLIKELY')){
                                sadness = 2;
                            }
                             else if(result[i+1].includes('UNLIKELY')){
                                sadness = 3;
                            }
                            else if(result[i+1].includes('UNKNOWN')){
                                sadness = 1;
                            }
                            else if(result[i+1].includes('LIKELY')){
                                sadness = 5;
                            }
                        }
                        if(result[i].includes('angerLikelihood')){
                            if(result[i+1].includes('VERY_LIKELY')){
                                anger = 6;
                            }
                            
                            else if(result[i+1].includes('POSSIBLE')){
                                anger = 4;
                            }
                            
                            else if(result[i+1].includes('VERY_UNLIKELY')){
                                anger = 2;
                            }
                            else if(result[i+1].includes('UNLIKELY')){
                                anger = 3;
                            }
                            else if(result[i+1].includes('UNKNOWN')){
                                anger = 1;
                            }
                            else if(result[i+1].includes('LIKELY')){
                                anger = 5;
                            }
                        }
                    }
                console.log('행'+happiness + '슬' + sadness + '화' + anger);
                if((happiness == sadness && anger)){
                    face = 'no_emotion';
                }
                else{
                    if(happiness > sadness){
                        face = 'happiness';
                        if(happiness > anger){
                            face = 'happiness';
                            console.log('행복');
                        }
                        else{
                            face = 'anger';
                            console.log('화남');
                        }
                    }
                    else{
                        face = 'sadness';
                        console.log('슬픔');
                    }
                }   
                user_emotion = face;
                callback(null, user_emotion);
            }
        },
        function(user_emotion, callback){
        moment.locale('ko');

        date = moment().utcOffset('+0900').format('LLL');
        month = moment().utcOffset('+0900').format('MM');
        console.log(month);
        if(month == 12 || 1 || 2){
            season = 'winter';
        }
        else if(month == 3 || 4 || 5){
            season = 'spring';
        }
        else if (month == 6 || 7 || 8){
            season = 'summer';
        }
        else{
            season = 'autumn';
        }
        
        var query2 = connection.query("SELECT * from musiclist where music_emotion = '" + user_emotion + "';", function(err,rows, fields){
            if(err){
                throw err;
            }
            else{
                    console.log('music query');
                
                if(user_emotion == 'no_emotion'){
                    connection.query("SELECT * from musiclist WHERE music_genre = '" + season + "';", function(err, rows, fields){
                            var a = Math.floor(Math.random()*5);
                            if((month == 12) || (month == 1) || (month == 2)){
                                if(rows[a].music_genre == 'winter')
                                    post_music = rows[a].music_file;
                            }
                            else if(month == 3 || 4 || 5){
                                if(rows[a].music_genre == 'spring')
                                    post_music = rows[a].music_file;
                            }
                            else if(month == 6 || 7 || 8){
                                if(rows[a].music_genre == 'summer')
                                    post_music = rows[a].music_file;
                            }
                            else if(month == 9 || 10 || 11){
                                if(rows[a].music_genre == 'autumn')
                                    post_music = rows[a].music_file;
                                }      
                            var sqlQuery = "INSERT INTO post SET ?";
                            var post = {post_img : post_img, post_user : login_ID, post_music : post_music, post_emotion1: user_emotion, post_emotion2: user_emotion, date: date};
                            function callback(err, result){
                                if(err){
                                    console.log("err");
                                    throw err
                                }
                                else{
                                    alert('게시글 이미지 업로드 완료. \n가장 높은 감정은 ' + user_emotion);
                                    res.render('viewProfile.html',{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
                                }
                            }
                            console.log("쿼리" + post_music);
                            var query = connection.query(sqlQuery, post, callback);
   
                    });
                  
                }
                else{
                    var a = Math.floor(Math.random()*25);
                    post_music = rows[a].music_file;
                    var sqlQuery = "INSERT INTO post SET ?";
                    var post = {post_img : post_img, post_user : login_ID, post_music : post_music, post_emotion1: user_emotion, post_emotion2: user_emotion, date: date};
                    function callback(err, result){
                        if(err){
                            console.log("err");
                            throw err
                        }
                        else{
                            alert('게시글 이미지 업로드 완료. \n가장 높은 감정은 ' + user_emotion);
                            res.render('viewProfile.html',{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
                        }
                    }
                    console.log("쿼리" + post_music);
                    var query = connection.query(sqlQuery, post, callback);

                }

            }
            console.log(a);
            
        });
        var Query2 = connection.query("UPDATE persons set user_emotion = '" + user_emotion + "' where id = '" + login_ID + "';",function(err,rows,fields){
           if(err) throw err; 
        });
       
            
        }
        
    ]);

    
});
router.route('/viewProfile').post(function(req,res){
    res.render('viewProfile.html',{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
});

router.route('/viewMy').post(function(req,res){
    var path;
    var path_music;
    var profile_path;
    connection.query("SELECT * from post WHERE post_user = '" + login_ID + "';", function(err, rows, fields){
        if (!err){
            connection.query("SELECT * from persons WHERE id = '" + login_ID + "';", function(err, rows2, fields){
                profile_path = "/uploads/" + rows2[0].profile_img;
            
            res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("	<!DOCTYPE html>	");
            res.write("	<html lang='ko'>	");
            res.write("	<head>	");
            res.write("	<meta charset='utf-8'>	");
            res.write("	<title>내 게시글 보기</title> 	");
            res.write("<link rel='stylesheet' href='css/viewmy.css'>");
            res.write("	<style>	");
            res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("	</head>	");
            res.write("	<body>	");
            res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'>	");
            res.write("	<img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');
            res.write("<form method = 'post' action='/viewProfile'>");
            res.write("<h5><input type = 'submit' value = '내 프로필' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
                
            res.write("<form method = 'post' action='/viewMy'>");
            res.write("<h5><input type = 'submit' value = '내 게시글' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewAll'>	");
            res.write("	<h5><input type = 'submit' value = '전체 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewEmotion'>	");
            res.write("	<h5><input type = 'submit' value = '감정과 같은 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/friendlist'>	");
            res.write("	<h5><input type = 'submit' value = '팔로우 목록 보기' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/musiclist'>	");
            res.write('	<h5><input type = "submit" value = "음악 플레이 리스트" class="right" name = ""></h5>	');
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/logout'>	");
            res.write("	<h5><input type = 'submit' value = '로그아웃' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");
            for(var i = (rows.length)-1; i >= 0; i--)
            {   
                path = "/uploads/" + rows[i].post_img;
                path_music = "/musiclist/" + rows[i].post_music;
                
                
                res.write("	<article class = 'article'> 	");
                res.write("	<section class = 'section'>	");
                res.write("	<div class = 'post'>	");
                res.write("	<div class='top'> 	");
                
                res.write(" <div class=image_profile");
                res.write("<br><img src = " + profile_path + " height = '50' width = '50' style='border-radius:30%;' >");     
                res.write("</div>");
                
                res.write("<h5 style='margin-left : 15px;'> " + rows[i].post_user+ "</h5>");
                res.write("<h5 style='margin-left : 30px;'> 날짜 : " + rows[i].date + "</h5>");
                res.write("</div>");
                
                res.write("<div>");
                res.write("<img src = " + path + " height = '500' width = '500' style='margin-left:50px;'>");
                res.write("</div>");
                
                res.write("<div>");
                res.write("<h5 style='margin-left:50px;'>" + rows[i].post_music + "</h5>");
                res.write("</div>");
                
                res.write("<div>");
                res.write("<audio src = " + path_music + " controls style='margin-left:50px;'></audio>");
                res.write("</div>"); 
                
                res.write("</div>");
                res.write("</section>");
                res.write("</article>");
                

            }
            res.write("</body>");
            res.write("</html>");
            res.end();              
            });
        }

        else
            console.log('Error while performing Query.', err);
    });
});

router.route('/viewAll').post(function(req,res){
    var arr = [];
    var least;
    var path;
    var path_music;
    var post_user;
    var date;
    var post_music;
    connection.query("SELECT * from post where post_user = '" + login_ID + "';", function(err, rows, fields){
    if (!err){
        least = rows.length;
        if(least == 0){
            connection.query("SELECT * from friends WHERE user_id = '" + login_ID + "';", function(err, rows, fields){
            if(!err){
                  if(rows.length == 0)
                      alert('보여줄 post가 없습니다.');
            }
            else{
                console.log('Error while performing Query.', err);
            }
            });
        }
    }
    else{
        console.log('Error while performing Query.', err);
    }
        
    });
    
    var all = [];
    
    arr.push(login_ID);
    console.log(arr[0]);
    
    async.waterfall([
       function(callback){
           connection.query("SELECT * from friends WHERE user_id = '" + login_ID + "';", function(err, rows, fields){
               callback(null, rows);
               
           });
       },
        function(rows, callback){
            if(rows.length != 0){
                for(var i = 0; i < rows.length; i++)
                {
                    arr.push(rows[i].friend_id);
                    console.log(arr);
                }
                callback(null, arr);
            }
            else{
                alert('친구가 0명이므로 내 게시물 보기를 이용하세요.');
            } 
            
        },
        function(arr, callback){
                res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("	<!DOCTYPE html>	");
            res.write("	<html lang='ko'>	");
            res.write("	<head>	");
            res.write("	<meta charset='utf-8'>	");
            res.write("	<title>전체 게시글 보기</title> 	");
            res.write("<link rel='stylesheet' href='css/viewmy.css'>");
            res.write("	<style>	");
            res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            
            res.write(".right5{");
            res.write("margin-left:45%;");
            res.write("background-image:url('images/heart3.jpg');");
            res.write("background-repeat:no-repeat;");
            res.write("width :50px;");
            res.write("height:50px;");
            res.write("border:none;");
            res.write("}");
            
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("	</head>	");
            res.write("	<body>	");
            res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<a = href='#'><img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'></a>	");
            res.write("	<a = href='#'><img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'></a>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');

            res.write("<form method = 'post' action='/viewProfile'>");
            res.write("<h5><input type = 'submit' value = '내 프로필' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("<form method = 'post' action='/viewMy'>");
            res.write("<h5><input type = 'submit' value = '내 게시글' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewAll'>	");
            res.write("	<h5><input type = 'submit' value = '전체 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewEmotion'>	");
            res.write("	<h5><input type = 'submit' value = '감정과 같은 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/friendlist'>	");
            res.write("	<h5><input type = 'submit' value = '팔로우 목록 보기' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/musiclist'>	");
            res.write('	<h5><input type = "submit" value = "음악 플레이 리스트" class="right" name = ""></h5>	');
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/logout'>	");
            res.write("	<h5><input type = 'submit' value = '로그아웃' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");  
                
            callback(null, arr);
        },
        function(arr, callback){
            async.timesSeries(arr.length, function(n, next){
                var sival=n;
                console.log(n);
                        async.waterfall([
                            function(callback){
                                connection.query("SELECT * from post WHERE post_user = '" + arr[sival] + "';", function(err, rows, fields){
                                    callback(null, rows);
                                });
                                
                            },
                            function(rows, callback){
                                var x = (rows.length)-1;
                                for(var j = x; j >= 0; j--)
                                {
                                    async.waterfall([
                                        function(callback){
                                            var fuck = rows[j];
                                            callback(null, fuck);
                                            
                                        },
                                        function(fuck, callback){
                                            connection.query("SELECT * from persons WHERE id = '" + fuck.post_user + "';", function(err, rows2, fields){
                                                var sib= [];
                                                sib[0] = rows2[0];
                                                sib[1] = fuck;
                                                callback(null, sib);
                                            });
                                            
                                        },
                                        function(sib, callback){
                                                connection.query("SELECT * from comments WHERE postid = '" + sib[1].idpost + "';", function(err, rows, fields){
                                                    if(!err){
                                                        for(var i = 0; i < rows.length; i++){
                                                            sib[i+2]=rows[i];
                                                        }
                                                        callback(null, sib);
                                                    }
                                                    else{
                                                        console.log('Error while performing Query.', err);
                                                    }
                                                });
                                        },
                                        function(sib, callback){
                                            path = "/uploads/" + sib[1].post_img;
                                            path_music = "/musiclist/" + sib[1].post_music;
                                            profile_path = "/uploads/" + sib[0].profile_img;                                       
                                            
                                            res.write("	<article class = 'article'> 	");
                                            res.write("	<section class = 'section'>	");
                                            res.write("	<div class = 'post'>	");
                                            res.write("<div class='invisible>'");
                                            
                                            res.write("</div>");
                                            res.write("	<div class='top'> 	");    
                                            res.write(" <div class=image_profile");        
                                            res.write("<br><img src = " + profile_path + " height = '50' width = '50' style='border-radius:30%;' >");     
                                            res.write("</div>");
                                            res.write("<h5 style='margin-left : 15px;'> " + sib[1].post_user+ "</h5>");
                                            res.write("<h5 style='margin-left : 30px;'> 날짜 : " + sib[1].date + "</h5>");
                                            res.write("</div>");
                                            res.write("<div>");
                                            res.write("<img src = " + path + " height = '500' width = '500' style='margin-left:50px;'>");
                                            res.write("</div>");
                                            res.write("<div>");
                                            res.write("<h5 style='margin-left:50px;'>" + sib[1].post_music + "</h5>");
                                            res.write("</div>");
                                            res.write("<div>");
                                            res.write("<audio src = " + path_music + " controls style='margin-left:50px;'></audio>");
                                            res.write("</div>");
                                            res.write("<div>");
                                            
                                            res.write("<h6> 좋아요 " + sib[1].like + "</h6>");
                                            console.log("comment if문");
                                            console.log(sib);
                                            for(var g = 2; g < sib.length; g++){
                                                res.write("<h6 style='font-weight : 800;'>" + sib[g].comment_user + "</h6>");
                                                res.write("<h5 style='font-weight : 400; margin-top:-20px;'>" + sib[g].comment_text + "</h5>");
                                            }
                                            res.write("<br>");
                                            res.write("<form method = 'post' action='/comment'>");
                                            res.write("<textarea rows = '1' columns = '1' name='idpost' style='display:none;'>"+ sib[1].idpost +"</textarea>");
                                            res.write("<lable>댓글</label>")
                                            res.write("<div class = 'dd'style='display:flex;'>");
                                            res.write("<input type ='txt' name='comment' style='height : 21px; width : 320px;'>");
                                            res.write("<input type = 'submit' value = '등록' name = '' class='right3' >")
                                            res.write("</div>");
                                            res.write("</form>");
                                            res.write("<form method = 'post' action='/like'>");
                                            res.write("<textarea rows = '1' columns = '1' name='idpost' style='display:none;'>"+ sib[1].idpost +"</textarea>");
                                            res.write("<input type = 'submit' value = '' name = '' class='right5' ");
                                            res.write("</input>");
                                            res.write("</form>");
                                            
                                            res.write("</div>");
                                            res.write("</div>");
                                            res.write("</section>");
                                            res.write("</article>");                      
                                        }                                        
                                        
                                    ]);
                               
                                    }
                                
                            },
                            function(callback){
                                    if((m+1) == arr.length){
                                            res.write("</body>");
                                            res.write("</html>");
                                            res.end();
                                    }
                                callback(null, 'done');
                            }
                        ]);
                next(null, 'done');
                    
            }, function(err, res){
                console.log("!");
            });
       
        }
        
    ]);
});

router.route('/comment').post(function(req, res){
    var postid = req.body.idpost;
    var comment = req.body.comment;
    moment.locale('ko');
    var date = moment().utcOffset('+0900').format('LLL');
    
    connection.query("SELECT * from post WHERE idpost = '" + postid + "';", function(err, rows, fields){
        if(!err){
                
                var sqlQuery = "INSERT INTO comments SET ?";
                var post = {postid: postid, comment_user: login_ID, comment_text: comment, date: date};
                function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        alert('댓글 등록 완료');
                    }
                }
                var query = connection.query(sqlQuery, post, callback);
        }
    })
    
});

router.route('/like').post(function(req, res){
    var postid = req.body.idpost;
    console.log("like");
    connection.query("SELECT * from post WHERE idpost = '" + postid + "';", function(err, rows, fields){
        if(!err){
            console.log(rows.length);
                for(var i = 0; i < rows.length; i++){
                    
                    var sqlQuery = "UPDATE post SET ? WHERE idpost = '" + postid + "';";
                    var like = (rows[i].like) + 1;
                    var post = {like: like};
                    function callback(err, result){
                        if(err){
                            console.log("err");
                            throw err
                        }
                        else{
                            alert('좋아요 추가 완료');
                        }
                    }
                    var query = connection.query(sqlQuery, post, callback);
                }
        }
        else{
            console.log("error like query",err);
        }
    });
    
});

router.route('/viewEmotion').post(function(req,res){
    var user_emotion;
    var path;
    var path_music;
    var post_user;
    var date;
    var post_music;
    async.waterfall([
       function(callback){
          connection.query("SELECT * from persons WHERE id = '" + login_ID + "';", function(err, rows, fields){
             user_emotion = rows[0].user_emotion 
              callback(null, user_emotion);
          });
       },
        function(user_emotion, callback){
            connection.query("SELECT * from post WHERE post_emotion1 = '" + user_emotion + "';", function(err, rows, fields){
                if (!err){
        
                    res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
                    res.write("	<!DOCTYPE html>	");
                    res.write("	<html lang='ko'>	");
                    res.write("	<head>	");
                    res.write("	<meta charset='utf-8'>	");
                    res.write("	<title>감정과 같은 게시글 보기</title> 	");
                    res.write("<link rel='stylesheet' href='css/viewmy.css'>");
                    res.write("	<style>	");
                    res.write("	html{	");
                    res.write("	background-size: cover;	");
                    res.write("	margin : 0;	");
                    res.write("	padding : 0;	");
                    res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
                    res.write("	}	");
                    res.write("	body{	");
                    res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
                    res.write("	margin : 0;	");
                    res.write("	padding : 0;	");
                    res.write("	background-image: url('images/snow12.jpg');	");
                    res.write("	-webkit-animation: snow 20s linear infinite;	");
                    res.write("	-moz-animation: snow 20s linear infinite;	");
                    res.write("	-ms-animation: snow 20s linear infinite;	");
                    res.write("	animation: snow 20s linear infinite;	");
                    res.write("	}	");
                    res.write("	@keyframes snow {	");
                    res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
                    res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
                    res.write("	}	");
                    res.write("	@-moz-keyframes snow {	");
                    res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
                    res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
                    res.write("	} 	");
                    res.write("	@-webkit-keyframes snow {	");
                    res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
                    res.write("	50% {}	");
                    res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
                    res.write("	} 	");
                    res.write("	@-ms-keyframes snow {	");
                    res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
                    res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
                    res.write("	}	");
                    res.write("	</style>	");
                    res.write("	</head>	");
                    res.write("	<body>	");
                    res.write("	<header class='head'>	");
                    res.write("	<div class = 'A'>	");
                    res.write("	<div class= 'B'>	");
                    res.write("	<div class='top'>	");
                    res.write("	<img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'>	");
                    res.write("	<img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'>	");
                    res.write("	</div>	");
                    res.write('	<div class="top2" >	');
                    res.write("<form method = 'post' action='/viewProfile'>");
                    res.write("<h5><input type = 'submit' value = '내 프로필' class='right' name = ''></h5>");
                    res.write(" </form>");
                    res.write("	<br>	");
                    res.write("<form method = 'post' action='/viewMy'>");
                    res.write("<h5><input type = 'submit' value = '내 게시글' class='right' name = ''></h5>");
                    res.write(" </form>");
                    res.write("	<br>	");
                    res.write("	<form method = 'post' action='/viewAll'>	");
                    res.write("	<h5><input type = 'submit' value = '전체 게시글' class='right' name = ''></h5>	");
                    res.write("	</form>	");
                    res.write("	<br>	");
                    res.write("	<form method = 'post' action='/viewEmotion'>	");
                    res.write("	<h5><input type = 'submit' value = '감정과 같은 게시글' class='right' name = ''></h5>	");
                    res.write("	</form>	");
                    res.write("	<br>	");
                    res.write("	<form method = 'post' action='/friendlist'>	");
                    res.write("	<h5><input type = 'submit' value = '팔로우 목록 보기' class='right' name = ''></h5>	");
                    res.write("	</form>	");
                    res.write("	<br>	");
                    res.write("	<form method = 'post' action='/musiclist'>	");
                    res.write('	<h5><input type = "submit" value = "음악 플레이 리스트" class="right" name = ""></h5>	');
                    res.write("	</form>	");
                    res.write("	<br>	");
                    res.write("	<form method = 'post' action='/logout'>	");
                    res.write("	<h5><input type = 'submit' value = '로그아웃' class='right' name = ''></h5>	");
                    res.write("	</form>	");
                    res.write("	<br>	");
                    res.write("	</div>	");
                    res.write("	</div>	");
                    res.write("	</div>	");
                    res.write("	</header>	");
                    res.write("<article style='height : 45px;'>");
                    
                    res.write("<h2 style='margin-left : 35%;'>" + login_ID+ "님의 감정은 " + user_emotion + "입니다.</h2>");
                    callback(null, rows);
                    res.write("</article>");
                }
                
                
            });
        },
        function(rows, callback){
            for(var i = (rows.length)-1; i >= 0; i--){
                async.waterfall([
                    function(callback){
                        var fuck = rows[i];
                        callback(null, fuck);
                    },
                    function(fuck, callback){
                        connection.query("SELECT * from persons WHERE id = '" + fuck.post_user + "';", function(err, rows2, fields){
                            path = "/uploads/" + fuck.post_img;
                            path_music = "/musiclist/" + fuck.post_music;
                            profile_path = "/uploads/" + rows2[0].profile_img;
                            
                            res.write("	<article class = 'article'> 	");
                            res.write("	<section class = 'section'>	");
                            res.write("	<div class = 'post'>	");
                            res.write("	<div class='top'> 	");
                            res.write(" <div class=image_profile");        
                            res.write("<br><img src = " + profile_path + " height = '50' width = '50' style='border-radius:30%;' >");     
                            res.write("</div>");
                            res.write("<h5 style='margin-left : 15px;'> " + fuck.post_user+ "</h5>");
                            res.write("<h5 style='margin-left : 30px;'> 날짜 : " + fuck.date + "</h5>");
                            res.write("</div>");
                            res.write("<div>");
                            res.write("<img src = " + path + " height = '500' width = '500' style='margin-left:50px;'>");
                            res.write("</div>");
                            res.write("<div>");
                            res.write("<h5 style='margin-left:50px;'>" + fuck.post_music + "</h5>");
                            res.write("</div>");
                            res.write("<div>");
                            res.write("<audio src = " + path_music + " controls style='margin-left:50px;'></audio>");
                            res.write("</div>"); 
                            res.write("</div>");
                            res.write("</section>");
                            res.write("</article>"); 
                        });
                        
                    }
                    
                ]);

            }
        },
        function(callback){
            res.write("</body>");
            res.write("</html>");
        }
    ]);

});

var friend_id;
var friend_name;
var friend_phone;
var friend_img;

router.route('/search').post(function(req, res){
    search_id = req.body.search_id;
    connection.query("SELECT * from persons where id = '" + search_id + "';", function(err, rows, fields){
    if (!err){
                if(rows.length != 0){
                    friend_id = rows[0].id;
                    friend_name = rows[0].name;
                    friend_phone = rows[0].phone;
                    friend_img = "/uploads/" + rows[0].profile_img;
                    var values = {id: friend_id, name: friend_name, phone: friend_phone, img: friend_img};
                    res.render("search2.html", values);
                }
                else{
                    alert('등록되지 않은 아이디입니다.');
                }
    }
    else
        console.log('Error while performing Query.', err);
    });
    
});
 
router.route('/addF').post(function(req, res){
    
    var check = 0;
        
        connection.query("SELECT * from friends where user_id = '" + login_ID + "';", function(err, rows, fields){
            if(!err){
                for(var i = 0; i < rows.length; i++)
                {
                    if(rows[i].friend_id == friend_id){
                        alert('이미 친구입니다.');
                        res.render("viewProfile.html",{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
                        check = 1;
                    }
                }
                
                var sqlQuery = "INSERT INTO friends SET ?";
                var post = {user_id: login_ID, friend_id: friend_id};
                function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        alert('친구 추가 완료.');
                        res.render("viewProfile.html",{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
                    }
                }
                if(check == 0){
                var query = connection.query(sqlQuery, post, callback);
                }
            }
            else
                console.log('Error while performing Query.', err);
        });
          
});
 
router.route('/delF').post(function(req, res){
        
        connection.query("SELECT * from friends WHERE user_id = '" + login_ID + "';", function(err, rows, fields){
 
               if(rows.length == 0){
                        alert('친구가 아닙니다.');
                        res.render("viewProfile.html",{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
 
                    }
                
                var sqlQuery = "DELETE from friends WHERE user_id = '" + login_ID + "' AND friend_id = '" + friend_id + "';";
                function callback(err, result){
                    if(err){
                        console.log("err");
                        throw err;
                    }
                    else{
                        alert('친구 삭제 완료.');
                        res.render("viewProfile.html",{login_ID : login_ID, profile_img: "/uploads/" + profile_img, post_img : "/uploads/" + post_img});
                    }
                }
                var query = connection.query(sqlQuery, callback);
            
            if(err)
                console.log('Error while performing Query.', err);
        });
          
});
 
router.route('/musiclist').post(function(req, res){
   
    connection.query("SELECT * from post WHERE post_user = '" + login_ID + "';", function(err, rows, fields){
        if (!err){
        
            res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("	<!DOCTYPE html>	");
            res.write("	<html lang='ko'>	");
            res.write("	<head>	");
            res.write("	<meta charset='utf-8'>	");
            res.write("	<title>음악 플레이 리스트</title> 	");
            res.write("<link rel='stylesheet' href='css/music.css'>");
            res.write("	<style>	");
            res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("	</head>	");
            res.write("	<body>	");
            res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'>	");
            res.write("	<img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');
            res.write("<form method = 'post' action='/viewProfile'>");
            res.write("<h5><input type = 'submit' value = '내 프로필' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("<form method = 'post' action='/viewMy'>");
            res.write("<h5><input type = 'submit' value = '내 게시글' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewAll'>	");
            res.write("	<h5><input type = 'submit' value = '전체 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewEmotion'>	");
            res.write("	<h5><input type = 'submit' value = '감정과 같은 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/friendlist'>	");
            res.write("	<h5><input type = 'submit' value = '팔로우 목록 보기' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/musiclist'>	");
            res.write('	<h5><input type = "submit" value = "음악 플레이 리스트" class="right" name = ""></h5>	');
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/logout'>	");
            res.write("	<h5><input type = 'submit' value = '로그아웃' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");
            
            for(var i = 0; i < rows.length; i++)
            {
                res.write("	<article class = 'article'> 	");
                res.write("	<section class = 'section'>	");
                res.write("	<div class = 'post'>	");
                res.write("	<div class='title'> 	");
                res.write("<h5 style='margin-left:120px;'>" + rows[i].post_music + "</h5>");
                res.write("	</div>	");
                res.write("	<div class='music'>	");
                 var path_music = "/musiclist/" + rows[i].post_music;
                res.write("<audio src = " + path_music + " controls style='margin-left:120px;'></audio>");
                res.write("	</div>	");
                res.write("	</div>	");
                res.write("	</section>	");
                res.write("	</article>	");       
            }
            
            res.write("</body>");
            res.write("</html>");
            res.end();
        }
        else
        console.log('Error while performing Query.', err);
    });
    
});

router.route('/friendlist').post(function(req, res){
    var profile_path;
    async.waterfall([
        function(callback){
            connection.query("SELECT * from friends WHERE user_id = '" + login_ID + "';", function(err, rows, fields){
                callback(null, rows);
            });
            
        },
        function(rows, callback){
               res.writeHead(200, {"Content-Type" : "text/html; charset=utf-8"});
            res.write("	<!DOCTYPE html>	");
            res.write("	<html lang='ko'>	");
            res.write("	<head>	");
            res.write("	<meta charset='utf-8'>	");
            res.write("	<title>팔로우 목록 보기</title> 	");
            res.write("<link rel='stylesheet' href='css/viewmy.css'>");
            res.write("	<style>	");
            res.write("	html{	");
            res.write("	background-size: cover;	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	overflow-y:scroll;overflow-x:hidden;background-repeat:repeat; background-attachment:fixed;	");
            res.write("	}	");
            res.write("	body{	");
            res.write("	font-family:'맑은 고딕', '고딕', '굴림'; 	");
            res.write("	margin : 0;	");
            res.write("	padding : 0;	");
            res.write("	background-image: url('images/snow12.jpg');	");
            res.write("	-webkit-animation: snow 20s linear infinite;	");
            res.write("	-moz-animation: snow 20s linear infinite;	");
            res.write("	-ms-animation: snow 20s linear infinite;	");
            res.write("	animation: snow 20s linear infinite;	");
            res.write("	}	");
            res.write("	@keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	@-moz-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-webkit-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	50% {}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	} 	");
            res.write("	@-ms-keyframes snow {	");
            res.write("	0% {background-position: 0px 0px, 0px 0px, 0px 0px;}	");
            res.write("	100% {background-position: 500px 1000px, 400px 400px, 300px 300px;}	");
            res.write("	}	");
            res.write("	</style>	");
            res.write("	</head>	");
            res.write("	<body>	");
            res.write("	<header class='head'>	");
            res.write("	<div class = 'A'>	");
            res.write("	<div class= 'B'>	");
            res.write("	<div class='top'>	");
            res.write("	<a = href='#'><img src='images/Nupdoung.jpg' alt='' class = 'image_profile2' style='margin-left : 50px;'></a>	");
            res.write("	<a = href='#'><img src='images/mark3.jpg' alt='' class = 'image_mark' style='margin-left : 10px;'></a>	");
            res.write("	</div>	");
            res.write('	<div class="top2" >	');
            res.write("<form method = 'post' action='/viewProfile'>");
            res.write("<h5><input type = 'submit' value = '내 프로필' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("<form method = 'post' action='/viewMy'>");
            res.write("<h5><input type = 'submit' value = '내 게시글' class='right' name = ''></h5>");
            res.write(" </form>");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewAll'>	");
            res.write("	<h5><input type = 'submit' value = '전체 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/viewEmotion'>	");
            res.write("	<h5><input type = 'submit' value = '감정과 같은 게시글' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/friendlist'>	");
            res.write("	<h5><input type = 'submit' value = '팔로우 목록 보기' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/musiclist'>	");
            res.write('	<h5><input type = "submit" value = "음악 플레이 리스트" class="right" name = ""></h5>	');
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	<form method = 'post' action='/logout'>	");
            res.write("	<h5><input type = 'submit' value = '로그아웃' class='right' name = ''></h5>	");
            res.write("	</form>	");
            res.write("	<br>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</div>	");
            res.write("	</header>	");
            callback(null, rows);
        },
        function(rows, callback){
            for(var i = 0; i < rows.length; i++){
                async.waterfall([
                    function(callback){
                        var fuck = rows[i];
                        console.log(fuck);
                        callback(null, fuck);
                    },
                    function(fuck, callback){
                        connection.query("SELECT * from persons WHERE id = '" + fuck.friend_id + "';", function(err, rows2, fields){
                            if(!err){
                                console.log(fuck);
                            console.log(fuck.friend_id);
                            console.log(rows2);
                            profile_path = "/uploads/" + rows2[0].profile_img;
                                
                            res.write("	<article class = 'article'> 	");
                            res.write("	<section class = 'section'>	");
                            res.write("	<div class = 'post'>	");
                            res.write("	<div class='top'> 	");
                
                            res.write(" <div class=image_profile");
                            res.write("<br><img src = " + profile_path + " height = '50' width = '50' style='border-radius:30%;' >");     
                            res.write("</div>");
                            res.write("<h5 style='margin-left:10px;'>" + fuck.friend_id + "</h5>");
                            res.write("</div>");
                            res.write("<div>");
                            res.write("<h4>이름: " + rows2[0].name + "</h4>");
                            res.write("</div>");
                            res.write("</div>");
                            res.write("</section>");
                            res.write("</article>");                 
                                
                            }
                            else{
                                console.log("err",err);
                            }
                                       
                        });
                    }
                    
                ]);
                
            }

            
        },
        function(callback){
                res.write("</body>");
                res.write("</html>");

        }
    ]);

});

router.route('/logout').post(function(req, res){
    res.render('layout2-result.html');
});

module.exports = router;