var express = require('express');

var session = require('express-session');

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
var request = require("request");

var _ = require('lodash');
var mongoose = require('mongoose');


mongoose.connect('mongodb://heroku_h9w3jgln:2vufqdllf7oct1plb7dlvtmobo@dbh11.mlab.com:27117/heroku_h9w3jgln');
mongoose.Promise = global.Promise;
var db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
var port = process.env.PORT || 3344;
var gameSchema = mongoose.Schema({
    fbid: String,
    coins: Number,
    createdate: { type: Date, default: Date.now },
    status: String

});
var betSchema = mongoose.Schema({
    owner: String,
    ownername: String,
    actionowner: String,
    betcoins: Number,
    beter: String,
    betername: String,
    actionbeter: String,
    result: String,
    createdate: { type: Date, default: Date.now },
    uptodate: Date,
    status: { type: String, default: 'OPEN' },

});



var app = express();

app.use(cookieParser());
app.use(session({ secret: 'somesecrettokenhere' }));
app.use(bodyParser());

//app.use(express.static('public'));
app.use(express.static(__dirname + "/public"));


var usergame = mongoose.model('USERGAMES', gameSchema);
var betreccord = mongoose.model('BETROCCORDS', betSchema);

var server = app.listen(port, function () {
    console.log('Listening on port: ' + port);
});



app.get('/', function (req, res) {

    res.sendfile('views/index.html', { root: __dirname })
});





app.get('/Login', function (req, res) {
    var id = req.query.id;

    var name = req.query.name;
    if (req.query != undefined) {

        usergame.findOne({ fbid: id }, function (err, response) {
            if (response == null) {
                var insert = new usergame({ fbid: id, status: 'OPEN', coins: 500 })
                insert.save(function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Insert completed');
                        req.session.name = name;
                        req.session.fbid = id;
                        res.send(true);
                    }
                });
            }
            else {
                req.session.name = name;
                req.session.fbid = id;
                res.send(true);

            }
        });

    }
    else {
        res.send(false);
    }
});




app.get('/CheckSession', function (req, res) {
    if (req.session.name != undefined) {
        GetCoins(req.session.fbid, function (c) {
            GetlistDermpan(function (recc) {

                GetHistory(function(his){
                    var data = {
                    name: req.session.name,
                    coins: c,
                    listdermpan: recc,
                    history:his
                }
                // console.log(data)
                res.send(data);

                });
           
            });


        });

    }
    else {
        res.send(false);
    }
});
app.get('/LogOut', function (req, res) {
    if (req.session.name != undefined) {
        req.session.destroy();

        res.redirect('/');
    }
});
app.get('/Bet', function (req, res) {
    var coins = req.query.coins;
    var action = req.query.action;
    var fbid = req.session.fbid;
    var name = req.session.name;
    BetProcess(fbid, coins, action, name, function (data) {
        res.json(data);
    });
});
app.get('/BetAway', function (req, res) {
    var recid = req.query.recid;
    var fbid = req.session.fbid;
    var name = req.session.name;
    var action = req.query.action;
    BetAwayProcess(recid, fbid, action, name, function (data) {

        res.json(data);
    })

});
function BetAwayProcess(recid, fid, action, name, cb) {
    var r = {
        status: '',
        content: '',
        history: [],
        listdermpan: [],
        coins: ''
    }
    var dt = new Date();

    usergame.findOne({ fbid: fid }, function (err, data) {
        if (data != null) {
            var coinMe = data.coins;
            betreccord.findById({ _id: recid }, function (err, betrec) {
                var coinbet = betrec.betcoins;
                var ownerid = betrec.owner;
                var ownername = betrec.ownername;
                if (coinbet > coinMe) {
                    r.status = "ERROR";
                    r.content = "The pocket money is not enough to bet";
                    cb(r);
                }else if(ownerid==fid){
                    r.status = "ERROR";
                    r.content = "You can not bet on your own";
                    cb(r);
                } 
                else {
                    var h = betrec.actionowner;
                    var a = action;
                    GetCoins(ownerid, function (coinowner) {
                        if (h == a) {//กรณีเสมอ

                            var total = coinowner + coinbet;

                            usergame.findOneAndUpdate({ fbid: ownerid }, { coins: total }, function () {
                                if (err) return res.send(500, { error: err });

                                betreccord.findOneAndUpdate({ _id: recid,status:'OPEN' }, { beter: fid, betername: name, actionbeter: a, result: 'DRAW', uptodate: dt, status: 'COMPLETE' }, function (err, res) {
                                    if (err) {
                                        console.log(err);
                                    }
                                    else {
                                        GetlistDermpan(function (dataDermpan) {

                                            GetHistory(function (dataHistory) {

                                                GetCoins(fid, function (coinMeupdate) {
                                                    r.status = "OK";
                                                    r.coins = coinMeupdate;
                                                    r.listdermpan = dataDermpan;
                                                    r.history = dataHistory;
                                                    cb(r);
                                                });
                                            });
                                        });
                                    }

                                });
                            });
                        }
                        else if ((h == "HAMMER" && a == "SCISSORS") || (h == "SCISSORS" && a == "PAPER") || (h == "PAPER" && a == "HAMMER")) {//กรณีเจ้าบ้านชนะ


                            usergame.findOneAndUpdate({ fbid: ownerid }, { coins: coinowner+(coinbet * 2) }, function () {
                                if (err) return res.send(500, { error: err });
                                var total = coinMe - coinbet;
                                usergame.findOneAndUpdate({ fbid: fid }, { coins: total }, function () {
                                    if (err) return res.send(500, { error: err });

                                    betreccord.findOneAndUpdate({ _id: recid,status:'OPEN' }, { beter: fid, betername: name, actionbeter: a, result: ownername, uptodate: dt, status: 'COMPLETE' }, function (err, res) {
                                        if (err) {
                                            console.log(err);
                                        } else {
                                            GetlistDermpan(function (dataDermpan) {

                                                GetHistory(function (dataHistory) {
                                                    GetCoins(fid, function (coinMeupdate) {
                                                        r.status = "OK";
                                                        r.coins = coinMeupdate;
                                                        r.listdermpan = dataDermpan;
                                                        r.history = dataHistory;
                                                        cb(r);
                                                    });
                                                });
                                            });
                                        }


                                    });
                                });
                            });
                        }
                        else {
                            var total = coinMe + coinbet;
                            usergame.findOneAndUpdate({ fbid: fid }, { coins: total }, function () {
                                if (err) return res.send(500, { error: err });

                                betreccord.findOneAndUpdate({ _id: recid,status:'OPEN' }, { beter: fid, betername: name, actionbeter: a, result: name, uptodate: dt, status: 'COMPLETE' }, function (err, res) {
                                    if (err) {
                                        console.log(err);
                                    } else {
                                        GetlistDermpan(function (dataDermpan) {

                                            GetHistory(function (dataHistory) {
                                                GetCoins(fid, function (coinMeupdate) {
                                                    r.status = "OK";
                                                    r.coins = coinMeupdate;
                                                    r.listdermpan = dataDermpan;
                                                    r.history = dataHistory;
                                                    cb(r);
                                                });
                                            });
                                        });

                                    }

                                });
                            });
                        }
                    });

                }
            })
        }
        else {
            cb(null)
        }
    });
}

function BetProcess(fid, coins, action, name, cb) {
    var data = {
        datas: [],
        status: '',
        content: '',
        coins: ''
    }
    usergame.findOne({ fbid: fid }, function (err, datas) {
        if (datas != null) {
            var coinsMe = datas.coins;
            if (coins > coinsMe) {
                data.status = 'ERROR'
                data.content = 'The pocket money is not enough to bet';
                cb(data);
            }
            else {
                var insert = new betreccord({
                    owner: fid,
                    ownername: name,
                    actionowner: action,
                    betcoins: coins
                });
                insert.save(function (err) {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log('Insert betreccord complete');

                        var total = coinsMe - coins;
                        usergame.findOneAndUpdate({ fbid: fid }, { coins: total }, function (err, res) {
                            if (err) return res.send(500, { error: err });

                            GetlistDermpan(function (recc) {


                                GetCoins(fid, function (coinMe) {
                                    data.status = 'OK';
                                    data.datas = recc;
                                    data.coins = coinMe;
                                    cb(data);

                                })
                            })
                        });
                    }
                });
            }
        }
        else {
            data.status = 'ERROR'
            cb(data)
        }


    });
}

function GetlistDermpan(cb) {
    betreccord.find({ status: 'OPEN' },'_id ownername betcoins', function (err, recc) {
        cb(recc);
    }).sort('-createdate');

}
function GetHistory(cb) {
    betreccord.find({ status: 'COMPLETE' },'_id ownername betcoins betername result', function (err, recc) {
        cb(recc);
    }).limit(20).sort('-uptodate');
}

function GetCoins(fid, cb) {
    //  console.log(fid)
    usergame.findOne({ fbid: fid }, function (err, res) {
        if (res != null) {
            cb(res.coins);
        }
        else {
            cb(null);
        }

    });
}




