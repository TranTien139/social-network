// app/routes.js

var User = require('../app/models/user.js');
var Status = require('../app/models/status.js');
var NewFeed = require('../app/controller/statusController.js');
var Chat = require('../app/models/chat.js');
var mongoose = require('mongoose');
var Group = require('../app/models/group.js');

var path = require('path'),
    fs = require('fs');

module.exports = function (app, passport, server) {

    app.get('/', function (req, res) {
        if (req.isAuthenticated()) {
            res.redirect('/home');
        } else {
            res.render('login.ejs', {message: req.flash('loginMessage')});
        }
    });

    app.get('/login', function (req, res) {

        // render the page and pass in any flash data if it exists
        if (req.isAuthenticated()) {
            res.redirect('/home');
        } else {
            res.render('login.ejs', {message: req.flash('loginMessage')});
        }
    });

    // process the login form
    app.post('/login', passport.authenticate('local-login', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/login', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // =====================================
    // SIGNUP ==============================
    // =====================================
    // show the signup form
    app.get('/signup', function (req, res) {

        // render the page and pass in any flash data if it exists
        if (req.isAuthenticated()) {
            res.redirect('/home');
        } else {
            res.render('login.ejs', {message: req.flash('signupMessage')});
        }
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect: '/home', // redirect to the secure profile section
        failureRedirect: '/signup', // redirect back to the signup page if there is an error
        failureFlash: true // allow flash messages
    }));

    // we will use route middleware to verify this (the isLoggedIn function)
    app.get('/home', isLoggedIn, function (req, res) {
        var user = req.user;

        if (user.local.image === '') {
            var domain = 'http://localhost:8080';
            fs.readFile('public/uploads/avatar/demo-avatar.png', function (err, data) {
                if (err) throw err;
                fs.writeFile('public/uploads/avatar/' + 'avatar_' + user._id.toString() + '.jpg', data, function (err) {
                    if (err) throw err;
                    user.local.image = domain + '/uploads/avatar/' + 'avatar_' + user._id.toString() + '.jpg';
                    user.save();
                });
            });
        }


        var j = user.followers;
        var newfeed = NewFeed.getNewFeed(user._id, j,0,function (err, data) {
            User.aggregate({$sample: {size: 3}}, function (err, ls) {
                res.render('index.ejs', {
                    user: user,
                    friend: user.followers,
                    newfeed: data,
                    random: ls
                });
            });

        });
    });

    // =====================================
    // LOGOUT ==============================
    // =====================================
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    app.get('/profile/:id_member', isLoggedIn, function (req, res) {
        var user_member = req.params.id_member;

        var user = req.user;
        var friend = user.followers;

        User.findOne({"_id": user_member}, function (err, users) {
            if (!err) {
                NewFeed.getNewFeedMe(user_member,0,function (err, data) {
                    var check = users.addfriend.indexOf(user._id.toString());
                    var isfriend = users.followers.filter(function (obj) {
                        return obj.userId === user._id.toString()
                    });
                    res.render('profile.ejs', {
                        user_other: users,
                        user: req.user,
                        timeline: data,
                        friend: friend,
                        check: check,
                        isfriend: isfriend
                    });
                });

            } else {
                res.end();
            }
        });
    });

    app.get('/about/:id_member', isLoggedIn, function (req, res) {
        var user_member = req.params.id_member;
        var user = req.user;
        User.findOne({"_id": user_member}, function (err, users) {
            if (!err) {
                var check = users.addfriend.indexOf(user._id.toString());
                var isfriend = users.followers.filter(function (obj) {
                    return obj.userId === user._id.toString()
                });
                res.render('about.ejs', {
                    user_other: users,
                    user: req.user,
                    friend: req.user.followers,
                    check: check,
                    isfriend: isfriend
                });

            } else {
                res.send(JSON.stringify(err), {
                    'Content-Type': 'application/json'
                }, 404);
            }
        });
    });

    app.get('/friends/:id_member', isLoggedIn, function (req, res) {
        var user_member = req.params.id_member;
        var user = req.user;
        User.findOne({"_id": user_member}, function (err, users) {
            if (!err) {
                var check = users.addfriend.indexOf(user._id.toString());
                var isfriend = users.followers.filter(function (obj) {
                    return obj.userId === user._id.toString()
                });
                res.render('friends.ejs', {
                    user_other: users,
                    user: req.user,
                    friend: req.user.followers,
                    check: check,
                    isfriend: isfriend
                });

            } else {
                res.send(JSON.stringify(err), {
                    'Content-Type': 'application/json'
                }, 404);
            }
        });
    });

    app.get('/photos/:id_member', isLoggedIn, function (req, res) {
        var user_member = req.params.id_member;
        var user = req.user;
        User.findOne({"_id": user_member}, function (err, users) {
            if (!err) {
                NewFeed.getNewFeedMe(user_member,0,function (err, data) {
                    var check = users.addfriend.indexOf(user._id.toString());
                    var isfriend = users.followers.filter(function (obj) {
                        return obj.userId === user._id.toString()
                    });
                    res.render('photos.ejs', {
                        user_other: users,
                        user: req.user,
                        timeline: data,
                        friend: req.user.followers,
                        check: check,
                        isfriend: isfriend
                    });
                });

            } else {
                res.send(JSON.stringify(err), {
                    'Content-Type': 'application/json'
                }, 404);
            }
        });
    });

    app.get('/edit/profile/:id_member', isLoggedIn, function (req, res) {
        res.render('edit_profile.ejs', {
            user: req.user,
            friend: req.user.followers
        });
    });

    app.post('/update-profile/:id_member', isLoggedIn, function (req, res) {
        var user_member = req.params.id_member;

        User.findOne({"_id": user_member}, function (err, users) {
            if (!err) {
                fs.readFile(req.files.myAvatar.path, function (err, data) {
                    var imageName = req.files.myAvatar.name;
                    if (!imageName) {
                        console.log("There was an error");
                    } else {
                        var newPath = __dirname + "/../public/uploads/avatar/" + 'avatar_' + users._id.toString() + '.jpg';
                        fs.writeFile(newPath, data, function (err) {
                            console.log('upload success');
                        });
                    }
                });

                fs.readFile(req.files.myCover.path, function (err, data) {
                    var imageName1 = req.files.myCover.name;
                    if (!imageName1) {
                        console.log("There was an error");
                    } else {
                        var newPath = __dirname + "/../public/uploads/cover/" + imageName1;
                        fs.writeFile(newPath, data, function (err) {
                            console.log('upload success');
                        });
                    }
                });

                var domain = 'http://localhost:8080';
                if (req.files.myAvatar.name !== '') {
                    var ava1 = 'avatar_' + users._id.toString() + '.jpg';
                    var ava = domain + '/uploads/avatar/' + ava1;
                } else {
                    var ava = users.local.image;
                }
                if (req.files.myCover.name !== '') {
                    var cover1 = req.files.myCover.name;
                    var cover = domain + '/uploads/cover/' + cover1;
                } else {
                    var cover = users.local.cover;
                }

                users.local.birthday = req.body.birthday;
                users.local.job = req.body.job;
                users.local.gender = req.body.gender;
                users.local.hometown = req.body.hometown;
                users.local.education = req.body.education;
                users.local.image = ava;
                users.local.cover = cover;
                users.save(function (err) {
                    backURL = req.header('Referer') || '/';
                    res.redirect(backURL);
                });
            } else {
                res.end('error');
            }
        });
    });

    app.get("/search_friend", isLoggedIn, function (req, res) {
        var regex = new RegExp(req.query["keyword"], 'i');
        var query = User.find({$or: [{"local.name": regex}, {"local.email": regex}]}).limit(20);
        query.exec(function (err, users) {
            if (!err) {
                res.render('search.ejs', {
                    key: req.query.keyword,
                    result: users,
                    user: req.user
                });
            } else {
                res.end();
            }
        });
    });

    app.post("/send-add-friend/:friend", isLoggedIn, function (req, res) {

        var user_me = req.user;
        var friend = req.params.friend;

        User.findOne({'_id': friend}, function (err, user) {
            if (err) return done(err);
            if (user) {
                if (user.addfriend.indexOf(user_me._id.toString()) === -1) {
                    user.addfriend.push(user_me._id.toString());
                    user.save();
                }
            }
        });
        res.end();
    });

    app.post("/send-unfriend/:friend", isLoggedIn, function (req, res) {
        var user_me = req.user;
        var friend = req.params.friend;

        User.findOne({'_id': friend}, function (err, users) {
            if (err) return done(err);
            var isfriend = users.followers.filter(function (obj) {
                return obj.userId !== user_me._id.toString()
            });
            users.followers = isfriend;
            users.save();

            var isfriend1 = user_me.followers.filter(function (obj) {
                return obj.userId !== users._id.toString()
            });
            user_me.followers = isfriend1;
            user_me.save();
        });
        res.end();
    });

    app.post("/send-unsendfriend/:friend", isLoggedIn, function (req, res) {
        var user_me = req.user;
        var friend = req.params.friend;

        User.findOne({'_id': friend}, function (err, users) {
            if (err) return done(err);
            if (users.addfriend.indexOf(user_me._id.toString()) !== -1) {
                users.addfriend.splice(users.addfriend.indexOf(user_me._id.toString()), 1);
                users.save();
            }
        });
        res.end();
    });

    app.post("/confirm-friend/:friend", isLoggedIn, function (req, res) {
        var user_me = req.user;
        var friend = req.params.friend;

        User.findOne({'_id': friend}, function (err, user) {
            if (err) return done(err);
            if (user) {
                var obj = {};
                obj.userId = user._id.toString();
                obj.image = user.local.image;
                obj.name = user.local.name;
                user_me.followers.push(obj);
                user_me.addfriend.splice(user_me.addfriend.indexOf(user_me._id.toString()), 1);
                user_me.save();

                var obj1 = {};
                obj1.userId = user_me._id.toString();
                obj1.image = user_me.local.image;
                obj1.name = user_me.local.name;
                user.followers.push(obj1);
                user.save();
            }
        });
        res.end();
    });

    app.post("/add-status", isLoggedIn, function (req, res) {
        var content = req.body.content_status;
        var user = req.user;
        var list_image = [];
        if (req.files.addImageStatus.originalFilename !== '') {
            fs.readFile(req.files.addImageStatus.path, function (err, data) {
                var imageName = req.files.addImageStatus.name;
                if (!imageName) {
                    console.log("There was an error");
                } else {
                    var newPath = __dirname + "/../public/uploads/status/" + imageName;
                    fs.writeFile(newPath, data, function (err) {
                        console.log('upload success');
                    });
                }
            });
            list_image.push(req.files.addImageStatus.name);
        }

        var status = new Status();
        status.content = content;
        status.like = [];
        status.share = [];
        status.comment = [];
        status.user.name = user.local.name;
        status.user.email = user.local.email;
        status.user.image = user.local.image;
        status.userId = user._id;
        status.image = list_image;
        status.save(function (err) {
            backURL = req.header('Referer') || '/';
            res.redirect(backURL);
        });
    });

    app.get('/chat', isLoggedIn, function (req, res) {
        var id = req.query.conversation;

        var user = req.user;

        Chat.findOne({$or: [{$and: [{'user.user1': user._id}, {'user.user2': id}]}, {$and: [{'user.user1': id}, {'user.user2': user._id}]}]}, function (err, chat_data) {
            if (err) return done(err);
            if (chat_data) {
                User.findOne({'_id': id}, function (err, users) {
                    if (err) return done(err);
                    res.render('chat.ejs', {
                        user: user,
                        chat_with: users,
                        data_chat: chat_data.content
                    });
                });
            } else {
                User.findOne({'_id': id}, function (err, users) {
                    if (err) return done(err);
                    res.render('chat.ejs', {
                        user: user,
                        chat_with: users,
                        data_chat: ''
                    });
                });
            }
        });
    });

    app.post('/post-chat', isLoggedIn, function (req, res) {
        var id = req.body.id_chat_with;
        var user = req.user;
        var content = req.body.message;
        var data_content = {};
        data_content.id = user._id;
        data_content.image = user.local.image;
        data_content.name = user.local.name;
        data_content.content = content;
        data_content.date = new Date();
        data_content.seen = '';

        User.findOne({'_id': id}, function (err, users) {
            if (err) return done(err);

            var arr = users.message.filter(function (obj) {
                return obj.id !== user._id.toString()
            });

            arr.push(data_content);
            users.message = arr;
            users.save();
        });

        Chat.findOne({$or: [{$and: [{'user.user1': user._id}, {'user.user2': id}]}, {$and: [{'user.user1': id}, {'user.user2': user._id}]}]}, function (err, chat_data) {
            if (err) return done(err);
            if (chat_data) {
                chat_data.content.push(data_content);
                chat_data.save(function (err) {
                    res.end();
                });
            } else {
                var chat = new Chat;
                chat.user.user1 = user._id;
                chat.user.user2 = id;
                chat.content.push(data_content);
                chat.first = user._id;
                chat.save(function (err) {
                    res.end();
                });
            }
        });
    });

    app.post("/post-comment/:id_status", isLoggedIn, function (req, res) {
        var id_status = req.params.id_status;
        var content = req.body.content_stt;
        var user = req.user;
        var action = req.body.action;
        NewFeed.getStatusPost(id_status, function (err, data1) {
            if (err) throw  err;
            var data = {};
            data.id = user._id;
            data.name = user.local.name;
            data.image = user.local.image;
            data.email = user.local.email;
            data.content = content;
            data.date = Date.now();
            if(action === '') {
                data1.comment.push(data);

            }else {
                var id_cmt = action.split('_');
               var cmt = data1.comment.filter(function (obj) {
                    return obj._id.toString() === id_cmt[1];
                });
                cmt[0].content = content;
            }
            data1.save(function (err) {
                if (err) throw  err;
            });
            var data ='';
            NewFeed.getUserPostStatus(data1.userId, function (err, user1) {
                if(user1._id.toString() != user._id.toString()) {
                    var noti = {};
                    noti.id = user._id;
                    noti.name = user.local.name;
                    noti.image = user.local.image;
                    noti.id_status = id_status;
                    noti.title = data1.content;
                    noti.action = 'comment';
                    user1.notify.push(noti);
                    user1.save();
                }
                var currentdate = new Date();
                var datetime = currentdate.getHours() + ":" + currentdate.getMinutes() + ":" + currentdate.getSeconds() +' '+ currentdate.getDate() + "-"+(currentdate.getMonth()+1) + "-" + currentdate.getFullYear();
                data ='<div class="box-comment"> <a href="/profile/'+user._id+'"><img class="img-circle img-sm" src="'+user.local.image+'"alt="User Image"> </a> <div class="comment-text"> <span class="username">'+user.local.name+'<span class="text-muted pull-right">'+datetime+'</span> </span> '+content+' </div> </div>';
                res.send(data);
            });
        });
    });

    app.post("/post-like/:action", isLoggedIn, function (req, res) {
        var id_status = req.body.id_article;
        var action = req.params.action;
        var user = req.user;
        NewFeed.getStatusPost(id_status, function (err, data1) {
            if (err) throw  err;
            if (action === 'like') {
                if (data1.like.indexOf(user._id.toString()) === -1) {
                    data1.like.push(user._id.toString());
                }
                NewFeed.getUserPostStatus(data1.userId, function (err, user1) {
                    if(user1._id.toString() != user._id.toString()) {
                        var noti = {};
                        noti.id = user._id;
                        noti.name = user.local.name;
                        noti.image = user.local.image;
                        noti.id_status = id_status;
                        noti.title = data1.content;
                        noti.action = 'like';
                        user1.notify.push(noti);
                        user1.save();
                    }
                });
            } else {
                data1.like.splice(data1.like.indexOf(user._id.toString()), 1);
            }
            data1.save(function (err) {
                if (err) throw  err;
                res.end();
            });
        });
    });

    app.post("/post-like-gr/:action", isLoggedIn, function (req, res) {
        var id_status = req.body.id_article;
        var action = req.params.action;
        var user = req.user;
        var id_group = req.body.id_group;
        Group.findOne({'_id': id_group}, function (err, data1) {
            if (err) throw  err;

            var temp = data1.data.filter(function (obj) {
                return obj._id.toString() === id_status.toString();
            });
            if (typeof temp === 'undefined') {
                temp[0] = [];
            }
            if (action === 'like') {
                if (temp[0].like.indexOf(user._id.toString()) === -1) {
                    temp[0].like.push(user._id.toString());
                }
                NewFeed.getUserPostStatus(temp[0].userId, function (err, user1) {
                    if(user1._id.toString() != user._id.toString()) {
                        var noti = {};
                        noti.id = user._id;
                        noti.name = user.local.name;
                        noti.image = user.local.image;
                        noti.id_status = id_status;
                        noti.title = temp[0].content;
                        noti.action = 'like';
                        user1.notify.push(noti);
                        user1.save();
                        res.end();
                    }
                });
            } else {
                temp[0].like.splice(temp[0].like.indexOf(user._id.toString()), 1);
            }
            data1.save(function (err) {
                if (err) throw  err;
                res.end();
            });
        });
    });


    app.post("/read-allmessage", isLoggedIn, function (req, res) {
        var user = req.user;
        user.message = [];
        user.save();
        res.end();
    });


    app.post("/get-list-addfriend", isLoggedIn, function (req, res) {
        var data = '';
        if (req.user.addfriend.length > 0) {
            User.find({
                '_id': {$in: req.user.addfriend}
            }, function (err, users) {
                for (var i = 0; i < users.length; i++) {
                    fr_id = "'" + users[i]._id + "'";
                    data = data + '<li style="width: 100%; height: 65px; margin-bottom: 10px;" id="fr_' + users[i]._id + '"><a href="/profile/'+users[i]._id+'"><div class="col-sm-3"><img src="' + users[i].local.image + '" style="width: 50px; height: 65px;"></div><div class="col-sm-5">' + users[i].local.name + '</div><div class="col-sm-4"><button class="btn btn-success" style="padding-left: 10px;" onclick="javascript:ConfirmAddFriend(' + fr_id + ')">Đồng ý</button><button class="btn btn-danger">Huỷ</button></div></a></li>';
                }
                res.send(data);
            });
        }
    });

    app.get('/group/:id', isLoggedIn, function (req, res) {
        var user = req.user;
        var id = req.params.id;

        Group.findOne({'_id': id}, function (err, data) {
            if (typeof  user.group != 'undefined') {
                var check = user.group.filter(function (obj) {
                    return obj.id === id;
                });
            } else {
                check = [];
            }

            res.render('group.ejs', {
                user: user,
                info: data,
                timeline: data.data,
                check: check
            });
        });
    });

    app.get('/member-group/:id', isLoggedIn, function (req, res) {
        var user = req.user;
        var id = req.params.id;

        Group.findOne({'_id': id}, function (err, data) {
            if (typeof  user.group != 'undefined') {
                var check = user.group.filter(function (obj) {
                    return obj.id === id;
                });
            } else {
                check = [];
            }
            res.render('group_member.ejs', {
                user: user,
                info: data,
                member_list: data.member,
                check: check
            });

        });
    });

    app.post('/create-group', isLoggedIn, function (req, res) {
        var user = req.user;
        var name = req.body.name;
        var description = req.body.description;

        var domain = 'http://localhost:8080';
        fs.readFile(req.files.cover.path, function (err, data) {
            var imageName1 = req.files.cover.name;
            if (!imageName1) {
                console.log("There was an error");
            } else {
                var newPath = __dirname + "/../public/uploads/covergroup/" + imageName1;
                fs.writeFile(newPath, data, function (err) {
                    console.log('upload success');
                });
            }
        });

        if (typeof  req.files.cover.name != 'undefined') {
            var cover = domain + '/uploads/covergroup/' + req.files.cover.name;
        } else {
            var cover = '';
        }

        var member = {};
        member.id = user._id;
        member.name = user.local.name;
        member.image = user.local.image;

        var group = new Group();
        group.creator = user._id;
        group.name = name;
        group.member = member;
        group.description = description;
        group.cover = cover;
        group.data = [];
        group.save();

        var gr = {};
        gr.id = group._id;
        gr.name = group.name;
        gr.cover = group.cover;
        user.group.push(gr);
        user.save();

        res.redirect('/group/' + group._id);
    });

    app.post("/add-status/group/:id", isLoggedIn, function (req, res) {
        var content = req.body.content_status;
        var user = req.user;
        var id = req.params.id;
        var list_image = [];
        if (req.files.addImageStatus.originalFilename !== '') {
            fs.readFile(req.files.addImageStatus.path, function (err, data) {
                var imageName = req.files.addImageStatus.name;
                if (!imageName) {
                    console.log("There was an error");
                } else {
                    var newPath = __dirname + "/../public/uploads/statusgroup/" + imageName;
                    fs.writeFile(newPath, data, function (err) {
                        console.log('upload success');
                    });
                }
            });
            list_image.push(req.files.addImageStatus.name);
        }
        Group.findOne({'_id': id}, function (err, data) {
            var status = {};
            status.content = content;
            status.like = [];
            status.share = [];
            status.comment = [];
            var datauser = {name: user.local.name, email: user.local.email, image: user.local.image};
            status.user = datauser;
            status.userId = user._id;
            status.image = list_image;

            data.data.push(status);
            data.save(function (err) {
            });
            backURL = req.header('Referer') || '/';
            res.redirect(backURL);
        });
    });

    app.post("/comment-status/group/:id_group/:id_article", isLoggedIn, function (req, res) {
        var id_status = req.params.id_article;
        var user = req.user;
        var id_group = req.params.id_group;
        Group.findOne({'_id': id_group}, function (err, data1) {
            if (err) throw  err;
            var temp = data1.data.filter(function (obj) {
                return obj._id.toString() === id_status.toString();
            });
            var comment = {};
            comment.id = user._id;
            comment.email = user.local.email;
            comment.image = user.local.image;
            comment.name = user.local.name;
            comment.content = req.body.content_comment;
            comment.like = [];
            temp[0].comment.push(comment);
            data1.save();
            NewFeed.getUserPostStatus(temp[0].userId, function (err, user1) {
                if(user1._id.toString() != user._id.toString()) {
                    var noti = {};
                    noti.id = user._id;
                    noti.name = user.local.name;
                    noti.image = user.local.image;
                    noti.id_status = id_status;
                    noti.title = data1.content;
                    noti.action = 'comment';
                    user1.notify.push(noti);
                    user1.save();
                }
                backURL = req.header('Referer') || '/';
                res.redirect(backURL);
            });
        });
    });

    app.post('/join-group/:id', isLoggedIn, function (req, res) {
        var user = req.user;
        var id = req.params.id;
        Group.findOne({'_id': id}, function (err, data) {
            var status = {};
            status.id = user._id;
            status.image = user.local.image;
            status.name = user.local.name;
            data.member.push(status);
            data.save();

            var gr = {};
            gr.id = data._id;
            gr.name = data.name;
            gr.cover = data.cover;
            user.group.push(gr);
            user.save();
            res.end();
        });
    });

    app.post('/unjoin-group/:id', isLoggedIn, function (req, res) {
        var user = req.user;
        var id = req.params.id;

        Group.findOne({'_id': id}, function (err, data) {
            var abc = data.member.filter(function (obj) {
                return obj.id !== user._id.toString()
            });
            data.member = abc;
            data.save();

            var cba = user.group.filter(function (obj) {
                return obj.id !== id;
            });
            user.group = cba;
            user.save();
            res.end();
        });
    });

    app.get('/create-group', isLoggedIn, function (req, res) {
        var user = req.user;
        var key = req.query.search;
        if (typeof key !== 'undefined') {
            var regex = new RegExp(key, 'i');
            var query = Group.find({"name": regex}).limit(20);
            query.exec(function (err, groups) {
                if (!err) {
                    res.render('create_group.ejs', {
                        user: user,
                        group: groups
                    });
                } else {
                    res.end();
                }
            });
        } else {
            var query = Group.find({}).limit(20);
            query.exec(function (err, groups) {
                if (!err) {
                    res.render('create_group.ejs', {
                        user: user,
                        group: groups
                    });
                } else {
                    res.end();
                }
            });
        }
    });

    app.post('/read-notification', isLoggedIn, function (req, res) {
        var user = req.user;
        user.notify = [];
        user.save();
        res.end();
    });

    app.get('/detail-status/:id',isLoggedIn ,function (req, res) {
        var id = req.params.id;
        var user = req.user;
        Status.findOne({'_id': id}, function (err,data) {
            res.render('detail-status.ejs', {
                user: user,
                detail: data
            });
        });
    });

    app.post('/delete-commentstatus',isLoggedIn, function (req, res) {
        var id_status = req.body.id_status;
        var id_comment = req.body.id_comment;
        Status.findOne({'_id': id_status}, function (err,data) {
            var cmt = data.comment.filter(function (obj) {
                return obj._id.toString() !== id_comment;
            });
            data.comment = cmt;
            data.save();
            res.end();
        });
    });

    app.post("/readmore-comment/:id_status", isLoggedIn, function (req, res) {
        var id_status = req.params.id_status;
        var user = req.user;
        NewFeed.getStatusPost(id_status, function (err, data1) {
            var data ='';
            var i= data1.comment.length;
            data1.comment.forEach(function (item) {
                if(i>3) {
                    data += '<div class="box-comment"> <a href="/profile/' + item.id + '"><img class="img-circle img-sm" src="' + item.image + '"alt="User Image"> </a> <div class="comment-text"> <span class="username">' + item.name + '<span class="text-muted pull-right">' + item.date.toLocaleTimeString() + ' ' + item.date.getDate() + '-' + item.date.getMonth() + '-' + item.date.getFullYear() + '</span> </span> ' + item.content + ' </div> </div>';
                }
                i--;
            });
            res.send(data);
        });
    });



    app.post("/loadMoreNewFeed", isLoggedIn, function (req, res) {
        res.end();
    });

    app.get("/loadMoreNewFeedHTML", isLoggedIn, function (req, res) {
        var user = req.user;
        var j = user.followers;
        var page = req.query.page;
        if(page === null){
            var page = 0;
        }
        var skip = page*10;
        var newfeed = NewFeed.getNewFeed(user._id, j,skip,function (err, data) {
            res.render('template/LoadMoreNewFeed.ejs',{
                user: user,
                newfeed: data,
            });
        });

    });

    // =====================================
    // FACEBOOK ROUTES =====================
    // =====================================
    // route for facebook authentication and login
    app.get('/auth/facebook', passport.authenticate('facebook', {scope: 'email'}));

    // handle the callback after facebook has authenticated the user
    app.get('/auth/facebook/callback',
        passport.authenticate('facebook', {
            successRedirect: '/home',
            failureRedirect: '/'
        }));

    // route for logging out
    app.get('/logout', function (req, res) {
        req.logout();
        res.redirect('/');
    });

    var io = require('socket.io')(server);
    var nicknames = [];

    var users = {};

    io.on('connection', function (socket) {
        socket.on('new user', function (data, callback) {
            if (data in users) {
                callback(false);
            } else {
                callback(true);
                socket.nickname = data;
                users[socket.nickname] = socket;
                nicknames.push(socket.nickname);
                updateNickName();
            }
        });

        socket.on('chat message', function (msg) {
            if (msg.id_chat_with != '' && (typeof users[msg.id_chat_with] !== 'undefined')) {
                users[msg.id_chat_with].emit('gui-lai', {
                    id: msg.id_send,
                    msg: msg.message,
                    name: msg.name_send,
                    image: msg.image_send,
                    datetime: msg.datetime
                });
            } else {
            }
        });

        socket.on('seen message', function (msg) {
            if (msg.id_chat_with != '' && (typeof users[msg.id_chat_with] !== 'undefined')) {
                users[msg.id_chat_with].emit('seen back', {});
            }
        });

        socket.on('disconnect', function (data) {
            if (!socket.nickname) return;
            delete users[socket.nickname];
            nicknames.splice(nicknames.indexOf(socket.nickname), 1);
            updateNickName();
        });

    });

    function updateNickName() {
        io.sockets.emit('usernames', nicknames);
    }


};


// route middleware to make sure
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
}
