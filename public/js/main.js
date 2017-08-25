
window.fbAsyncInit = function () {
    FB.init({
        appId: '110885632922422',
        autoLogAppEvents: true,
        xfbml: true,
        cookie: true,
        version: 'v2.9'
    });
    FB.AppEvents.logPageView();
};

(function (d, s, id) {
    var js, fjs = d.getElementsByTagName(s)[0];
    if (d.getElementById(id)) { return; }
    js = d.createElement(s); js.id = id;
    js.src = "//connect.facebook.net/en_US/sdk.js";
    fjs.parentNode.insertBefore(js, fjs);
}(document, 'script', 'facebook-jssdk'));



var v = new Vue({
    el: '#app',
    data: {
        nameProfile: '',
        coinsMe: '',
        coinsDermpan: '',
        listdermpan: [],
        listHistory: []

    },
    methods: {
        loginFB: function (event) {
            FB.login(function (response) {
                FB.api('/me', function (data) {
                    $.ajax({
                        url: '/Login',
                        data: data,
                        type: 'GET',
                        success: function (res) {

                            // v.nameProfile = data.name;
                            v.CheckSession();

                        }
                    })
                });
            });
        },
        CheckSession: function () {
            $.ajax({
                url: '/CheckSession',
                type: 'GET',
                success: function (res) {
                    if (res != false) {
                        $('#login').hide();
                        $('#MainShow').show();

                        v.nameProfile = res.name;
                        v.coinsMe = res.coins;
                        v.listdermpan = res.listdermpan;
                        v.listHistory=res.history;
                        $('#login').hide();
                        $('#MainShow').show();

                    }
                    else {

                    }

                }
            });
        },  
        itemSelect: function (event) {
            $('.box-dermpan a div').removeClass("select");
            var name = $(event.target).attr('name');
            // a.addClass('select');

            $(".box-dermpan a div[name='" + name + "']").addClass("select");
        },
        Bet: function () {
            var m = parseInt(v.coinsDermpan);
            var a = $('.box-dermpan a div.select').attr('name');
            if (a == undefined || a == null) {
                alert('Please select item bet.')
            }
            else if(m==null||m==undefined||m==0){
                 alert('Please input coins !!')
            }
            else {
                $.ajax({
                    url: '/Bet',
                    type: 'GET',
                    data: {
                        coins: m,
                        action: a
                    },
                    success: function (res) {
                        //console.log(res)
                        if (res.status == 'OK') {
                            console.log(res.datas)
                            v.listdermpan = res.datas
                            v.coinsMe = res.coins;

                        }
                        else if (res.status == 'ERROR' && res.content != null) {
                            alert(res.content);
                        }


                    }
                });
            }

        },
        BetAway: function (item, value) {
            var idrec = item._id;
            if (idrec != undefined && idrec != null && v != undefined) {
                $.ajax({
                    url: '/BetAway',
                    type: 'GET',
                    data: {
                        recid: idrec,
                        action: value
                    },
                    success: function (res) {
                        console.log(res)
                        if (res.status == 'ERROR' && res.content != null) {
                            alert(res.content);
                        }
                        else {
                            v.listdermpan = res.listdermpan
                            v.coinsMe = res.coins;
                            v.listHistory = res.history;
                        }
                    }
                });
            }

        },
        DailyQuest:function(){
                   $.ajax({
                    url: '/DailyQuest',
                    type: 'GET',                  
                    success: function (res) {
                        console.log(res)
                        if (res.status == 'ERROR' && res.content != null) {
                            alert(res.content);
                        }
                        else {
                          alert(res.content);
                          v.coinsMe = res.coins;
                           
                        }
                    }
                });
        }



    }
});
v.CheckSession();








///Common script///
function isNumber(evt) {
    evt = (evt) ? evt : window.event;
    var charCode = (evt.which) ? evt.which : evt.keyCode;
    if (charCode > 31 && (charCode < 48 || charCode > 57)) {
        return false;
    }
    return true;
}