// Basic Init
require.config({
  paths: {
    echarts: '/scripts'
  }
})

function drawChart(id, option, type) {
  require(
    [
      'echarts',
      'echarts/chart/' + type
    ],
    function(ec) {
      var myChart = ec.init(document.getElementById(id))
      myChart.setOption(option)
    }
  )
}

var db = new LocalDB("githuber.info");
var collection = db.collection("userInfo");

function updateLocalDB() {
    collection.drop();
    collection.insert(window.config);
}
collection.find().then(function(data) {
    if (data.length) {
        window.config = data[0];
    } else {
        window.config = {};
    }
})

function utf8_to_b64(str) {
    return window.btoa(unescape(encodeURIComponent(str)));
}

function b64_to_utf8(str) {
    return decodeURIComponent(escape(window.atob(str)));
}
Object.size = function(obj) {
    var size = 0,
        key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

$(function() {
    $(".navbar a").click(function() {
        $(".navbar-toggle").not(".collapsed").click()
    })
    var triggerFeedback = function() {
        $(document).trigger("feedback", [$("#feedback-email").val(), $("#feedback-content").val()])
        $("#feedback-main").hide(0);
        $("#feedback-gangnam-style").show(0);
        setTimeout(function() {
            $("#feedback-btn").trigger("click")
            $("#feedback-gangnam-style").hide(0);
            $("#feedback-email, #feedback-content").val("")
            $("#feedback-main").show(0);
            setTimeout(function() {
                $("#feedback-btn").one("click", triggerFeedback)
            }, 5000)
        }, 2000)
        return false
    }
    $("#feedback-btn").one("click", triggerFeedback)
    $("#feedback-main").click(function() {
        return false;
    })
    $.digits = function(text){
        return text.toString().replace(/(\d)(?=(\d\d\d)+(?!\d))/g, "$1,");
    }
})

// Angular app
var App = angular.module('App', ['ngRoute']);
App.config(['$routeProvider', function($routeProvider) {
    $routeProvider.
    when('/index', {
        controller: 'indexCtl',
        templateUrl: 'views/index.html'
    }).
    when('/about', {
        controller: 'aboutCtl',
        templateUrl: 'views/about.html'
    }).
    when('/donate', {
        templateUrl: 'views/donate.html'
    }).
    when('/search/:targetUser', {
        controller: 'searchCtl',
        templateUrl: 'views/search.html',
        reloadOnSearch: false
    }).
    otherwise({
        redirectTo: '/index'
    });
}]);



var App = angular.module('App');
var clearBDShare = function() {
        $(".bdshare-slide-button-box").remove()
        window._bd_share_is_recently_loaded = false
        window._bd_share_main = null
    }
App.controller('searchCtl', ['$scope', '$routeParams', function($scope, $routeParams) {
    clearBDShare()
    $("#new-feature").click(function() {
        $("#new-feature-modal").modal("show")
    })
    window.forShare = $routeParams.forShare || 0
    if (window.forShare) {
        window.config.token = $routeParams.token
    }
    var smallWindow = $(window).width() < 768
    if (!smallWindow) {
        $(".spec-info").css("padding", "30px")
    }
    $("#repo-modal-content").height($(window).height() - $(window).height() / 4 - 60)
    $(document).trigger("github_id", $routeParams.targetUser)
    if (!window.config) {
        window.config = {}
    }
    var debug = false
    if (debug) {
        window.config.token = "acd18045340051e7bd1e1a4bd6e4f2571c475e53"
    } else {
        if (window.config && window.config.token) {
            var token = window.config.token
        } else if ($routeParams.token) {
            var token = $routeParams.token
            window.config.token = token
            updateLocalDB()
        } else {
            window.location.href = "https://github.com/login/oauth/authorize?client_id=03fc78670cf59a7a1ca4&state=" + $routeParams.targetUser
            return
        }
        $(document).trigger("token", window.config.token)
    }
    if (window.location.hash.indexOf("token") != -1) {
        window.location.hash = "/search/" + $routeParams.targetUser
    }
    $.ajaxSetup({
        headers: {
            "Authorization": "token " + window.config.token
        }
    })
    $scope.targetUser = $routeParams.targetUser;
    $scope.languageBytesInOwnedRepos = {} // 自己repo的语言字节数统计 注意这里是字节数不是行数 GitHub不提供行数
    $scope.languageOfStarredRepos = {} // star repo的语言统计 只统计个数 比如Python的repo 100个
    $scope.ownedRepoInfos = {} // 自己的repo被star的次数以及repo的信息，比如title description以及readme
    $scope.totalBytes = 0
    $scope.githuber = {};
    $scope.byteChart = {};
    $scope.starChart = {};
    $scope.weekChart = {};
    $scope.dayChart = {};
    var Barrier = function() { // 用于等待多个ajax完成
        this.barrierNumber = 0
        this.checkFinish = function(cb) {
            that = this;
            var clock = function() {
                if (that.barrierNumber === 0) {
                    cb()
                } else {
                    setTimeout(clock, 200)
                }
            }
            setTimeout(clock, 200)
        }
    }
    if (!(window.config && window.config.email) && !window.forShare) {
        setTimeout(function() {
            $("#enter-email").slideDown(function() {
                $("#inputEmail3").focus()
            })
        }, 2000)
    }
    $scope.closeEmail = function() {
        window.config.email = true
        updateLocalDB()
        $("#enter-email").slideUp()
    };
    $scope.saveEmail = function() {
        window.config.email = true
        updateLocalDB()
        $("#enter-email").slideUp()
        $(document).trigger("emailAddr", $("#inputEmail3").val());
    };
    $scope.searchUser = function() {
        getUserInfo($scope.targetUser);
    };

    $scope.generateShareImg = function() {
        $.ajax({
            url: "http://api.githuber.info/generateImg?token=" + window.config.token + "&width=" + $(window).width() + "&username=" + $routeParams.targetUser,
            dataType: "json",
            method: "GET",
            success: function(data) {
                $(".bdshare-slide-button-box").remove()
                window._bd_share_is_recently_loaded = false
                window._bd_share_main = null
                window._bd_share_config={"common":{"bdSnsKey":{},"bdText":"我在#GitHuber.info#发现牛人一枚，其名曰" + $routeParams.targetUser + "，其详如图，你也来试试吧 @GitHuber_info","bdMini":"1","bdMiniList":["weixin","tsina","qzone","sqq","douban","renren","huaban","youdao","mail","linkedin","copy"],"bdPic":data.url,"bdStyle":"0","bdSize":"16"},"slide":{"type":"slide","bdImg":"0","bdPos":"right","bdTop":"150.5"}};with(document)0[(getElementsByTagName('head')[0]||body).appendChild(createElement('script')).src='http://bdimg.share.baidu.com/static/api/js/share.js?v=89860593.js?cdnversion='+~(-new Date()/36e5)];
            }
        })
    }

    var getUserInfo = function(targetUser) {
        var info = ['login', 'avatar_url', 'name', 'company', 'email', 'followers', 'public_repos', 'created_at'];
        if ($scope.targetUser != "") {
            var url = "https://api.github.com/users/" + targetUser;
            $.ajax({
                url: url,
                dataType: "json",
                method: "GET",
                success: function(data) {
                    if (!window.forShare) {
                        $scope.generateShareImg()
                    }
                    getActivityInfo($scope.targetUser)
                    getCodeLines($scope.targetUser);
                    getStarredInfo($scope.targetUser);
                    repoInitial($scope.targetUser);
                    for (var i = 0, l = info.length; i < l; i++) {
                        $scope.githuber[info[i]] = data[info[i]] == "?" ? undefined : data[info[i]];
                    }
                    $(document).trigger(utf8_to_b64(url), JSON.stringify($scope.githuber))
                    $scope.githuber.isLoaded = true;
                    $scope.githuber.isSuccessLoaded = true;
                    $scope.githuber.followers = $.digits($scope.githuber.followers)
                    $scope.githuber.public_repos = $.digits($scope.githuber.public_repos)
                    $scope.githuber.day = Math.floor((((new Date()).getTime()) - new Date(data.created_at))/(1000*60*60*24))
                    $scope.$digest();
                },
                error: function(data) {
                    $scope.githuber.isLoaded = true;
                    $scope.githuber.isErrorLoaded = true;
                    $scope.$digest();
                }
            }, true);
        }
    };
    var getActivityInfo = function(targetUser) {
        $.ajax({
            url: "https://osrc.dfm.io/" + targetUser + ".json",
            dataType: "jsonp",
            success: function(data) {
                var week = {}
                var day = {}
                var temp = {}
                var category = ['']
                $.map(data.usage.events, function(event, i) {
                    temp[event.type.replace("Event", "")] = event
                    category.push(event.type.replace("Event", ""))
                })
                $.each(temp, function(type, info) {
                    day[type] = info.day

                    week[type] = info.week
                    var s = week[type].shift()
                    week[type].push(s)
                })
                var week_series = []
                $.map(category, function(type, i) {
                    if (type == '') {
                        return
                    }
                    week_series.push({
                        name: type,
                        type: 'bar',
                        stack: '每周平均活跃度',
                        data: week[type]
                    })
                })
                var week_option = {
                    title: {
                        text: '周平均动态',
                    },
                    grid: {
                        y: "80"
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { // 坐标轴指示器，坐标轴触发有效
                            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
                        }
                    },
                    legend: {
                        data: category
                    },
                    xAxis: [{
                        type: 'category',
                        data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
                    }],
                    yAxis: [{
                        type: 'value'
                    }],
                    series: week_series
                };
                $scope.weekChart.isLoaded = true;
                $scope.weekChart.isSuccessLoaded = true;
                $scope.$digest();
                drawChart("week-chart", week_option, "bar");
                day_series = []
                $.map(category, function(type, i) {
                    if (type == '') {
                        return
                    }
                    day_series.push({
                        name: type,
                        type: 'bar',
                        stack: '每日平均活跃度',
                        data: day[type]
                    })
                })
                var day_option = {
                    title: {
                        text: '日平均动态',
                    },
                    grid: {
                        y: "80"
                    },
                    tooltip: {
                        trigger: 'axis',
                        axisPointer: { // 坐标轴指示器，坐标轴触发有效
                            type: 'shadow' // 默认为直线，可选为：'line' | 'shadow'
                        }
                    },
                    legend: {
                        data: category
                    },
                    xAxis: [{
                        type: 'category',
                        data: ['00:00', '01:00', '02:00', '03:00', '04:00', '05:00', '06:00', '07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00']
                    }],
                    yAxis: [{
                        type: 'value'
                    }],
                    series: day_series
                };
                $scope.dayChart.isLoaded = true;
                $scope.dayChart.isSuccessLoaded = true;
                $scope.$digest();
                drawChart("day-chart", day_option, "bar");
            },
            error: function(err) {
                $scope.weekChart.isLoaded = true;
                $scope.weekChart.isErrorLoaded = true;
                $scope.dayChart.isLoaded = true;
                $scope.dayChart.isErrorLoaded = true;
                $scope.$digest();
            }
        });
    }
    var getCodeLines = function(targetUser) {
        $.ajax({
            url: "https://api.github.com/users/" + targetUser + "/repos?page=1&per_page=10000",
            dataType: "json",
            method: "GET",
            success: function(data) {
                if (data == "") {
                    $scope.byteChart.isLoaded = true;
                    $scope.byteChart.isErrorLoaded = true;
                    $scope.$digest();
                }
                var barrier = new Barrier();
                barrier.barrierNumber = data.length;
                $.map(data, function(repo, i) {
                    if (repo.fork) {
                        barrier.barrierNumber--
                        return
                    }
                    $scope.ownedRepoInfos[repo.id] = {
                        description: repo.description,
                        name: repo.name,
                        stars: repo.stargazers_count,
                        url: repo.html_url
                    };
                    var url = "https://api.github.com/repos/" + targetUser + "/" + repo.name + "/languages"
                    $.ajax({
                        url: url,
                        dataType: "json",
                        success: function(data) {

                            barrier.barrierNumber--
                            if (repo.fork || "status" in data || $.isEmptyObject(data)) {
                                return
                            }
                            $(document).trigger(utf8_to_b64(url), JSON.stringify(data))
                            $.each(data, function(language, lines) {
                                if (isNaN(lines)) {
                                    return
                                }
                                if (!(language in $scope.languageBytesInOwnedRepos)) {
                                    $scope.languageBytesInOwnedRepos[language] = 0
                                }
                                $scope.languageBytesInOwnedRepos[language] += lines
                            });
                        },
                        statusCode: {
                            403: function() {
                                barrier.barrierNumber--
                            }
                        }
                    })
                });
                barrier.checkFinish(function() {
                    var allRepos = []
                    $.each($scope.ownedRepoInfos, function(id, repo) {
                        repo.id = id
                        allRepos.push(repo)
                    });
                    allRepos.sort(function(a, b) {
                        return b.stars - a.stars
                    });
                    $.map(allRepos, function(repo, i) {
                        $("#repo-details").append('<div class="row">' +
                            '<div class="col-lg-10 col-lg-offset-1" style="border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#E8E8E8;">' +
                            '<h2>' + repo.name + ' <span class="label label-' + (i >= 3 ? 'default' : 'warning') + '">' + repo.stars + ' Stars</span></h2>' +
                            '<p style="font-size:16px;">' + repo.description + '</p>' +
                            '<button type="button" class="btn btn-default readme-btn" data-id="' + repo.id + '">查看readme</button>' +
                            '<a target="_blank" class="btn btn-primary repo-btn" href="' + repo.url + '">项目主页</a>' +
                            '</div>' +
                            '</div>')
                    })
                    $(".readme-btn:last").closest("div").css("border-bottom", "none");
                    var data = [];
                    $.each($scope.languageBytesInOwnedRepos, function(language, bytes) {
                        data.push({
                            name: language,
                            value: bytes
                        });
                    });
                    $("#byte-chart").height(data.length * 40 + 150);
                    data.sort(function(a, b) {
                        return a.value - b.value
                    });
                    var categories = [];
                    var values = [];

                    for (var i = 0; i < data.length; i++) {
                        categories.push(data[i].name);
                        if (smallWindow) {
                            values.push(Math.floor(data[i].value / 1000));
                        } else {
                            values.push(data[i].value);
                        }
                    }
                    $scope.githuber.codings = values.reduce(function(x, y) {
                        return x + y
                    }, 0)
                    if (smallWindow) {
                        $scope.githuber.codings = $scope.githuber.codings * 1000
                    }
                    $scope.githuber.codings = $.digits($scope.githuber.codings)
                    var option = {
                        title: {
                            text: '代码量统计',
                            subtext: '单位：字节'
                        },
                        tooltip: {
                            trigger: 'axis'
                        },
                        xAxis: [{
                            axisLabel: {
                                formatter: function(value) {
                                    if (smallWindow) {
                                        return value + "K"
                                    } else {
                                        return value
                                    }
                                },
                                rotate: $(window).width() < 768 ? -45 : 0
                            },
                            type: 'value',
                            boundaryGap: [0, 0],
                        }],
                        yAxis: [{
                            type: 'category',
                            data: categories
                        }],
                        series: [{
                            name: '代码量',
                            type: 'bar',
                            data: values
                        }]
                    };
                    $scope.byteChart.isLoaded = true;
                    $scope.byteChart.isSuccessLoaded = true;
                    $scope.$digest();
                    drawChart("byte-chart", option, "bar");
                });
            }
        })
    };
    // 获取star的repo并统计语言
    var getStarredInfo = function(targetUser) {
        var getStarredInfoAt = function(pageNumber) {
            var url = "https://api.github.com/users/" + targetUser + "/starred?page=" + pageNumber + "&per_page=100"
            $.ajax({
                url: url,
                dataType: "json",
                method: "GET",
                success: function(data) {
                    if (pageNumber == 1 && data == "") {
                        $scope.starChart.isLoaded = true;
                        $scope.starChart.isErrorLoaded = true;
                        $scope.$digest();
                    }
                    var temp = []
                    $.map(data, function(repo, i) {
                        temp.push({
                            language: repo.language
                        })
                        if (repo.language) {
                            if (!(repo.language in $scope.languageOfStarredRepos)) {
                                $scope.languageOfStarredRepos[repo.language] = 0
                            }
                            $scope.languageOfStarredRepos[repo.language] += 1
                        }
                    })

                    $(document).trigger(utf8_to_b64(url), JSON.stringify(temp))
                    if (data.length === 100) {
                        getStarredInfoAt(pageNumber + 1)
                    } else {
                        var data = []
                        $.each($scope.languageOfStarredRepos, function(language, stars) {
                            data.push({
                                name: language,
                                value: stars
                            })
                        })
                        var option = {
                            title: {
                                text: 'star项目语言统计',
                                subtext: '',
                                x: 'center'
                            },
                            tooltip: {
                                trigger: 'item',
                                formatter: "{a} <br/>{b} : {c} ({d}%)"
                            },
                            series: [{
                                name: '语言',
                                type: 'pie',
                                radius: '60%',
                                center: ['50%', '60%'],
                                data: data
                            }]
                        };
                        $scope.starChart.isLoaded = true;
                        $scope.starChart.isSuccessLoaded = true;
                        $scope.$digest();
                        drawChart("star-chart", option, "pie");

                    }
                },
            })
        };
        getStarredInfoAt(1);
    };


    // var getContributionInfo = function(targetUser) {
    //     // 获取fork的repo并统计自己在其中的贡献字节数
    //     github.get({
    //         url: "https://api.github.com/users/" + targetUser + "/repos?page=1&per_page=10000",
    //         dataType: "json"
    //     }).done(function(data) {
    //         var barrier = new Barrier()
    //         barrier.barrierNumber = data.length
    //         $.map(data, function(repo, i) {
    //             github.get({
    //                 url: "https://api.github.com/repos/" + targetUser + "/" + repo.name,
    //                 dataType: "json"
    //             }).done(function(data) {
    //                 if (!("parent" in data) || $.isEmptyObject(data)) {
    //                     barrier.barrierNumber--
    //                         return
    //                 }
    //                 var getContributionInfoAt = function(pageNumber) {
    //                     github.get({
    //                         url: "https://api.github.com/repos/" + data.parent.owner.login + "/" + data.name + "/stats/contributors?page=" + pageNumber + "&per_page=100",
    //                         dataType: "json"
    //                     }).done(function(data) {
    //                         var findUser = false
    //                         $.map(data, function(contribution, i) {
    //                             if (contribution.author.login === targetUser) {
    //                                 findUser = true
    //                                 $.map(contribution.weeks, function(week, i) {
    //                                     contributionBytes += week.a + week.d + week.c
    //                                 })
    //                             }
    //                         })
    //                         if (findUser) {
    //                             barrier.barrierNumber--
    //                         } else if (data.length === 100 && pageNumber < 10) {
    //                             getContributionInfoAt(pageNumber + 1)
    //                         } else {
    //                             barrier.barrierNumber--
    //                         }
    //                     })
    //                 };
    //                 getContributionInfoAt(1)
    //             });
    //         });
    //         barrier.checkFinish(function() {
    //             console.log(contributionBytes)
    //         });
    //     });
    // }
    var repoInitial = function(targetUser) {
        $("#repo-details").on("click", ".readme-btn", function() {
            repo = $scope.ownedRepoInfos[$(this).data("id")]
            $("#repo-modal-name").html(repo.name)
            $("#repo-modal-content").html("README内容载入中，请稍候......")
            if (!($scope.ownedRepoInfos[repo.id].hasOwnProperty("readme"))) {
                $.ajax({
                    url: "https://api.github.com/repos/" + targetUser + "/" + repo.name + "/readme",
                    dataType: "json",
                    method: "GET",
                    success: function(data) {
                        $.ajax({
                            url: "http://api.githuber.info/btoa",
                            method: "POST",
                            dataType: "json",
                            data: {
                                "md": data.content
                            },
                            success: function(data) {
                                $.ajax({
                                    url: "https://api.github.com/markdown",
                                    method: "POST",
                                    data: JSON.stringify({
                                        "text": data.result,
                                        "mode": "markdown"
                                    }),
                                    success: function(data) {
                                        $scope.ownedRepoInfos[repo.id].readme = data
                                        $("#repo-modal-content").html(data)
                                    }
                                })
                            }
                        })
                    }
                })
            } else {
                $("#repo-modal-content").html($scope.ownedRepoInfos[repo.id].readme)
            }
            $("#repo-modal").modal("show");
        });
    }

    $scope.searchUser();
}]).controller('indexCtl', ['$scope', '$location', function($scope, $location) {
    $(".support-logo").css({"transform": "scale(" + ($(window).height() / 1200) + ")"});
    clearBDShare()
    $(".support-logo").css({"transform": "scale(" + ($(window).height() / 1200) + ")"})
    $.fn.textWidth = function() {
        var html_org = $(this).html();
        var html_calc = '<span>' + html_org + '</span>';
        $(this).html(html_calc);
        var width = $(this).find('span:first').width();
        $(this).html(html_org);
        return width;
    };
    $("#slogan").parent().height($(window).height() / 4)
    $("#search-part").height($(window).height() - $("#slogan").parent().height() - 100 - 71 - parseFloat($(".container-fluid.ng-scope").css("margin-top").replace("px", "")) - $(".support-logo").height());
    $("#slogan").css({
        "paddingLeft": ($("#our-name").textWidth() - $("#slogan").textWidth() - 3) + "px"
    })
    $scope.search = function() {
        if ($('#index-input').typeahead('val').replace(/\s/g, "") != "") {
            window.bigcache = {}
            $location.path("/search/" + $('#index-input').typeahead('val').replace(/\s/g, ""));
        }
    };
    var stid
    var nowFunc
    $('body').keyup(function(e) {
        if (e.keyCode == 32) {
            clearTimeout(stid)
            nowFunc()
        }
    });
    function findMatches(q, cb) {
        clearTimeout(stid)
        var matches
        matches = []
        var strs = []
        var isFullname = false
        try {
            window.btoa(q)
        } catch (err) {
            isFullname = true
        };
        if (isFullname) {
            var searchKeyword = []
            var needBlank = /^[A-Za-z][A-Za-z0-9]*$/
            for (var i = 0; i < q.length; i++) {
                if (!needBlank.test(q[i])) {
                    searchKeyword.push(q[i])
                }
                else {
                    if (searchKeyword.length == 0) {
                        searchKeyword.push(q[i])
                    }
                    else {
                        searchKeyword[searchKeyword.length - 1] = searchKeyword[searchKeyword.length - 1] + q[i]
                    }
                }
            }
            searchKeyword = searchKeyword.join(" ")
            var searchFullname = function() {
                $.ajax({
                    url: "https://api.github.com/search/users?q=" + searchKeyword + "+in:fullname",
                    dataType: "json",
                    method: "GET",
                    success: function(data) {
                        if (data.total_count != 0) {
                            $.each(data.items, function(i, user) {
                                matches.push({
                                    value: user.login,
                                    src: user.avatar_url
                                });
                            });
                            cb(matches);
                        }
                    }
                })
            }
            stid = setTimeout(searchFullname, 200)
            nowFunc = searchFullname
        }
        else {
            var searchUsername = function() {
                $.ajax({
                    url: "https://api.github.com/search/users?q=" + q + "+in:username",
                    dataType: "json",
                    method: "GET",
                    success: function(data) {
                        if (data.total_count == 0) {
                            $.ajax({
                                url: "https://api.github.com/search/users?q=" + q + "+in:fullname",
                                dataType: "json",
                                method: "GET",
                                success: function(data) {
                                    if (data.total_count != 0) {
                                        $.each(data.items, function(i, user) {
                                            matches.push({
                                                value: user.login,
                                                src: user.avatar_url
                                            });
                                        });
                                        cb(matches);
                                    }
                                }
                            })
                        }
                        else {
                            $.each(data.items, function(i, user) {
                                matches.push({
                                    value: user.login,
                                    src: user.avatar_url
                                });
                            });
                            cb(matches);
                        }
                    }
                })
            }
            stid = setTimeout(searchUsername, 300)
            nowFunc = searchUsername
        }
    };

    $('#index-input').typeahead({
        hint: true,
        highlight: true,
        minLength: 1
    }, {
        name: 'user',
        displayKey: 'value',
        source: findMatches,
        templates: {
            suggestion: function(item) {
                return "<p><img class='search-avatar' src=" + item.src + " alt='头像加载中' />" + item.value + "</p>"
            }
        }
    });
    $('html').on("typeahead:selected", function() {
        $("#lookup").click()
    })
    setTimeout(function() {
        $("#index-input").trigger("focus")
    }, 300)

}]).controller('navCtl', ['$scope', '$location', function($scope, $location) {
    clearBDShare()
    $scope.search = function() {
        if ($scope.sw.replace(/\s/g, "") != "") {
            window.bigcache = {}
            $location.path("/search/" + $scope.sw);
        }
    };
}]).controller('aboutCtl', ['$scope', '$location', function($scope, $location) {
    clearBDShare()
    $scope.search = function() {
        if ($scope.sw.replace(/\s/g, "") != "") {
            window.bigcache = {}
            $location.path("/search/" + $scope.sw);
        }
    };
    $(".label-info").hover(function() {
        $(this).css("cursor", "pointer")
    }).click(function() {
        window.open($(this).data("url"))
    })
}]);

!function(t){t.AV=t.AV||{},t.AV.VERSION="js0.4.6"}(this),function(){var t=this,e=t._,n={},i=Array.prototype,r=Object.prototype,s=Function.prototype,a=i.push,o=i.slice,u=i.concat,c=r.toString,l=r.hasOwnProperty,h=i.forEach,d=i.map,f=i.reduce,p=i.reduceRight,_=i.filter,m=i.every,v=i.some,g=i.indexOf,b=i.lastIndexOf,y=Array.isArray,w=Object.keys,A=s.bind,O=function(t){return t instanceof O?t:this instanceof O?void(this._wrapped=t):new O(t)};"undefined"!=typeof exports?("undefined"!=typeof module&&module.exports&&(exports=module.exports=O),exports._=O):t._=O,O.VERSION="1.4.4";var x=O.each=O.forEach=function(t,e,i){if(null!=t)if(h&&t.forEach===h)t.forEach(e,i);else if(t.length===+t.length){for(var r=0,s=t.length;s>r;r++)if(e.call(i,t[r],r,t)===n)return}else for(var a in t)if(O.has(t,a)&&e.call(i,t[a],a,t)===n)return};O.map=O.collect=function(t,e,n){var i=[];return null==t?i:d&&t.map===d?t.map(e,n):(x(t,function(t,r,s){i[i.length]=e.call(n,t,r,s)}),i)};var S="Reduce of empty array with no initial value";O.reduce=O.foldl=O.inject=function(t,e,n,i){var r=arguments.length>2;if(null==t&&(t=[]),f&&t.reduce===f)return i&&(e=O.bind(e,i)),r?t.reduce(e,n):t.reduce(e);if(x(t,function(t,s,a){r?n=e.call(i,n,t,s,a):(n=t,r=!0)}),!r)throw new TypeError(S);return n},O.reduceRight=O.foldr=function(t,e,n,i){var r=arguments.length>2;if(null==t&&(t=[]),p&&t.reduceRight===p)return i&&(e=O.bind(e,i)),r?t.reduceRight(e,n):t.reduceRight(e);var s=t.length;if(s!==+s){var a=O.keys(t);s=a.length}if(x(t,function(o,u,c){u=a?a[--s]:--s,r?n=e.call(i,n,t[u],u,c):(n=t[u],r=!0)}),!r)throw new TypeError(S);return n},O.find=O.detect=function(t,e,n){var i;return E(t,function(t,r,s){return e.call(n,t,r,s)?(i=t,!0):void 0}),i},O.filter=O.select=function(t,e,n){var i=[];return null==t?i:_&&t.filter===_?t.filter(e,n):(x(t,function(t,r,s){e.call(n,t,r,s)&&(i[i.length]=t)}),i)},O.reject=function(t,e,n){return O.filter(t,function(t,i,r){return!e.call(n,t,i,r)},n)},O.every=O.all=function(t,e,i){e||(e=O.identity);var r=!0;return null==t?r:m&&t.every===m?t.every(e,i):(x(t,function(t,s,a){return(r=r&&e.call(i,t,s,a))?void 0:n}),!!r)};var E=O.some=O.any=function(t,e,i){e||(e=O.identity);var r=!1;return null==t?r:v&&t.some===v?t.some(e,i):(x(t,function(t,s,a){return r||(r=e.call(i,t,s,a))?n:void 0}),!!r)};O.contains=O.include=function(t,e){return null==t?!1:g&&t.indexOf===g?-1!=t.indexOf(e):E(t,function(t){return t===e})},O.invoke=function(t,e){var n=o.call(arguments,2),i=O.isFunction(e);return O.map(t,function(t){return(i?e:t[e]).apply(t,n)})},O.pluck=function(t,e){return O.map(t,function(t){return t[e]})},O.where=function(t,e,n){return O.isEmpty(e)?n?null:[]:O[n?"find":"filter"](t,function(t){for(var n in e)if(e[n]!==t[n])return!1;return!0})},O.findWhere=function(t,e){return O.where(t,e,!0)},O.max=function(t,e,n){if(!e&&O.isArray(t)&&t[0]===+t[0]&&t.length<65535)return Math.max.apply(Math,t);if(!e&&O.isEmpty(t))return-1/0;var i={computed:-1/0,value:-1/0};return x(t,function(t,r,s){var a=e?e.call(n,t,r,s):t;a>=i.computed&&(i={value:t,computed:a})}),i.value},O.min=function(t,e,n){if(!e&&O.isArray(t)&&t[0]===+t[0]&&t.length<65535)return Math.min.apply(Math,t);if(!e&&O.isEmpty(t))return 1/0;var i={computed:1/0,value:1/0};return x(t,function(t,r,s){var a=e?e.call(n,t,r,s):t;a<i.computed&&(i={value:t,computed:a})}),i.value},O.shuffle=function(t){var e,n=0,i=[];return x(t,function(t){e=O.random(n++),i[n-1]=i[e],i[e]=t}),i};var C=function(t){return O.isFunction(t)?t:function(e){return e[t]}};O.sortBy=function(t,e,n){var i=C(e);return O.pluck(O.map(t,function(t,e,r){return{value:t,index:e,criteria:i.call(n,t,e,r)}}).sort(function(t,e){var n=t.criteria,i=e.criteria;if(n!==i){if(n>i||void 0===n)return 1;if(i>n||void 0===i)return-1}return t.index<e.index?-1:1}),"value")};var j=function(t,e,n,i){var r={},s=C(e||O.identity);return x(t,function(e,a){var o=s.call(n,e,a,t);i(r,o,e)}),r};O.groupBy=function(t,e,n){return j(t,e,n,function(t,e,n){(O.has(t,e)?t[e]:t[e]=[]).push(n)})},O.countBy=function(t,e,n){return j(t,e,n,function(t,e){O.has(t,e)||(t[e]=0),t[e]++})},O.sortedIndex=function(t,e,n,i){n=null==n?O.identity:C(n);for(var r=n.call(i,e),s=0,a=t.length;a>s;){var o=s+a>>>1;n.call(i,t[o])<r?s=o+1:a=o}return s},O.toArray=function(t){return t?O.isArray(t)?o.call(t):t.length===+t.length?O.map(t,O.identity):O.values(t):[]},O.size=function(t){return null==t?0:t.length===+t.length?t.length:O.keys(t).length},O.first=O.head=O.take=function(t,e,n){return null==t?void 0:null==e||n?t[0]:o.call(t,0,e)},O.initial=function(t,e,n){return o.call(t,0,t.length-(null==e||n?1:e))},O.last=function(t,e,n){return null==t?void 0:null==e||n?t[t.length-1]:o.call(t,Math.max(t.length-e,0))},O.rest=O.tail=O.drop=function(t,e,n){return o.call(t,null==e||n?1:e)},O.compact=function(t){return O.filter(t,O.identity)};var N=function(t,e,n){return x(t,function(t){O.isArray(t)?e?a.apply(n,t):N(t,e,n):n.push(t)}),n};O.flatten=function(t,e){return N(t,e,[])},O.without=function(t){return O.difference(t,o.call(arguments,1))},O.uniq=O.unique=function(t,e,n,i){O.isFunction(e)&&(i=n,n=e,e=!1);var r=n?O.map(t,n,i):t,s=[],a=[];return x(r,function(n,i){(e?i&&a[a.length-1]===n:O.contains(a,n))||(a.push(n),s.push(t[i]))}),s},O.union=function(){return O.uniq(u.apply(i,arguments))},O.intersection=function(t){var e=o.call(arguments,1);return O.filter(O.uniq(t),function(t){return O.every(e,function(e){return O.indexOf(e,t)>=0})})},O.difference=function(t){var e=u.apply(i,o.call(arguments,1));return O.filter(t,function(t){return!O.contains(e,t)})},O.zip=function(){for(var t=o.call(arguments),e=O.max(O.pluck(t,"length")),n=new Array(e),i=0;e>i;i++)n[i]=O.pluck(t,""+i);return n},O.object=function(t,e){if(null==t)return{};for(var n={},i=0,r=t.length;r>i;i++)e?n[t[i]]=e[i]:n[t[i][0]]=t[i][1];return n},O.indexOf=function(t,e,n){if(null==t)return-1;var i=0,r=t.length;if(n){if("number"!=typeof n)return i=O.sortedIndex(t,e),t[i]===e?i:-1;i=0>n?Math.max(0,r+n):n}if(g&&t.indexOf===g)return t.indexOf(e,n);for(;r>i;i++)if(t[i]===e)return i;return-1},O.lastIndexOf=function(t,e,n){if(null==t)return-1;var i=null!=n;if(b&&t.lastIndexOf===b)return i?t.lastIndexOf(e,n):t.lastIndexOf(e);for(var r=i?n:t.length;r--;)if(t[r]===e)return r;return-1},O.range=function(t,e,n){arguments.length<=1&&(e=t||0,t=0),n=arguments[2]||1;for(var i=Math.max(Math.ceil((e-t)/n),0),r=0,s=new Array(i);i>r;)s[r++]=t,t+=n;return s},O.bind=function(t,e){if(t.bind===A&&A)return A.apply(t,o.call(arguments,1));var n=o.call(arguments,2);return function(){return t.apply(e,n.concat(o.call(arguments)))}},O.partial=function(t){var e=o.call(arguments,1);return function(){return t.apply(this,e.concat(o.call(arguments)))}},O.bindAll=function(t){var e=o.call(arguments,1);return 0===e.length&&(e=O.functions(t)),x(e,function(e){t[e]=O.bind(t[e],t)}),t},O.memoize=function(t,e){var n={};return e||(e=O.identity),function(){var i=e.apply(this,arguments);return O.has(n,i)?n[i]:n[i]=t.apply(this,arguments)}},O.delay=function(t,e){var n=o.call(arguments,2);return setTimeout(function(){return t.apply(null,n)},e)},O.defer=function(t){return O.delay.apply(O,[t,1].concat(o.call(arguments,1)))},O.throttle=function(t,e){var n,i,r,s,a=0,o=function(){a=new Date,r=null,s=t.apply(n,i)};return function(){var u=new Date,c=e-(u-a);return n=this,i=arguments,0>=c?(clearTimeout(r),r=null,a=u,s=t.apply(n,i)):r||(r=setTimeout(o,c)),s}},O.debounce=function(t,e,n){var i,r;return function(){var s=this,a=arguments,o=function(){i=null,n||(r=t.apply(s,a))},u=n&&!i;return clearTimeout(i),i=setTimeout(o,e),u&&(r=t.apply(s,a)),r}},O.once=function(t){var e,n=!1;return function(){return n?e:(n=!0,e=t.apply(this,arguments),t=null,e)}},O.wrap=function(t,e){return function(){var n=[t];return a.apply(n,arguments),e.apply(this,n)}},O.compose=function(){var t=arguments;return function(){for(var e=arguments,n=t.length-1;n>=0;n--)e=[t[n].apply(this,e)];return e[0]}},O.after=function(t,e){return 0>=t?e():function(){return--t<1?e.apply(this,arguments):void 0}},O.keys=w||function(t){if(t!==Object(t))throw new TypeError("Invalid object");var e=[];for(var n in t)O.has(t,n)&&(e[e.length]=n);return e},O.values=function(t){var e=[];for(var n in t)O.has(t,n)&&e.push(t[n]);return e},O.pairs=function(t){var e=[];for(var n in t)O.has(t,n)&&e.push([n,t[n]]);return e},O.invert=function(t){var e={};for(var n in t)O.has(t,n)&&(e[t[n]]=n);return e},O.functions=O.methods=function(t){var e=[];for(var n in t)O.isFunction(t[n])&&e.push(n);return e.sort()},O.extend=function(t){return x(o.call(arguments,1),function(e){if(e)for(var n in e)t[n]=e[n]}),t},O.pick=function(t){var e={},n=u.apply(i,o.call(arguments,1));return x(n,function(n){n in t&&(e[n]=t[n])}),e},O.omit=function(t){var e={},n=u.apply(i,o.call(arguments,1));for(var r in t)O.contains(n,r)||(e[r]=t[r]);return e},O.defaults=function(t){return x(o.call(arguments,1),function(e){if(e)for(var n in e)null==t[n]&&(t[n]=e[n])}),t},O.clone=function(t){return O.isObject(t)?O.isArray(t)?t.slice():O.extend({},t):t},O.tap=function(t,e){return e(t),t};var R=function(t,e,n,i){if(t===e)return 0!==t||1/t==1/e;if(null==t||null==e)return t===e;t instanceof O&&(t=t._wrapped),e instanceof O&&(e=e._wrapped);var r=c.call(t);if(r!=c.call(e))return!1;switch(r){case"[object String]":return t==String(e);case"[object Number]":return t!=+t?e!=+e:0==t?1/t==1/e:t==+e;case"[object Date]":case"[object Boolean]":return+t==+e;case"[object RegExp]":return t.source==e.source&&t.global==e.global&&t.multiline==e.multiline&&t.ignoreCase==e.ignoreCase}if("object"!=typeof t||"object"!=typeof e)return!1;for(var s=n.length;s--;)if(n[s]==t)return i[s]==e;n.push(t),i.push(e);var a=0,o=!0;if("[object Array]"==r){if(a=t.length,o=a==e.length)for(;a--&&(o=R(t[a],e[a],n,i)););}else{var u=t.constructor,l=e.constructor;if(u!==l&&!(O.isFunction(u)&&u instanceof u&&O.isFunction(l)&&l instanceof l))return!1;for(var h in t)if(O.has(t,h)&&(a++,!(o=O.has(e,h)&&R(t[h],e[h],n,i))))break;if(o){for(h in e)if(O.has(e,h)&&!a--)break;o=!a}}return n.pop(),i.pop(),o};O.isEqual=function(t,e){return R(t,e,[],[])},O.isEmpty=function(t){if(null==t)return!0;if(O.isArray(t)||O.isString(t))return 0===t.length;for(var e in t)if(O.has(t,e))return!1;return!0},O.isElement=function(t){return!(!t||1!==t.nodeType)},O.isArray=y||function(t){return"[object Array]"==c.call(t)},O.isObject=function(t){return t===Object(t)},x(["Arguments","Function","String","Number","Date","RegExp"],function(t){O["is"+t]=function(e){return c.call(e)=="[object "+t+"]"}}),O.isArguments(arguments)||(O.isArguments=function(t){return!(!t||!O.has(t,"callee"))}),"function"!=typeof/./&&(O.isFunction=function(t){return"function"==typeof t}),O.isFinite=function(t){return isFinite(t)&&!isNaN(parseFloat(t))},O.isNaN=function(t){return O.isNumber(t)&&t!=+t},O.isBoolean=function(t){return t===!0||t===!1||"[object Boolean]"==c.call(t)},O.isNull=function(t){return null===t},O.isUndefined=function(t){return void 0===t},O.has=function(t,e){return l.call(t,e)},O.noConflict=function(){return t._=e,this},O.identity=function(t){return t},O.times=function(t,e,n){for(var i=Array(t),r=0;t>r;r++)i[r]=e.call(n,r);return i},O.random=function(t,e){return null==e&&(e=t,t=0),t+Math.floor(Math.random()*(e-t+1))};var I={escape:{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#x27;","/":"&#x2F;"}};I.unescape=O.invert(I.escape);var U={escape:new RegExp("["+O.keys(I.escape).join("")+"]","g"),unescape:new RegExp("("+O.keys(I.unescape).join("|")+")","g")};O.each(["escape","unescape"],function(t){O[t]=function(e){return null==e?"":(""+e).replace(U[t],function(e){return I[t][e]})}}),O.result=function(t,e){if(null==t)return null;var n=t[e];return O.isFunction(n)?n.call(t):n},O.mixin=function(t){x(O.functions(t),function(e){var n=O[e]=t[e];O.prototype[e]=function(){var t=[this._wrapped];return a.apply(t,arguments),q.call(this,n.apply(O,t))}})};var P=0;O.uniqueId=function(t){var e=++P+"";return t?t+e:e},O.templateSettings={evaluate:/<%([\s\S]+?)%>/g,interpolate:/<%=([\s\S]+?)%>/g,escape:/<%-([\s\S]+?)%>/g};var T=/(.)^/,k={"'":"'","\\":"\\","\r":"r","\n":"n","	":"t","\u2028":"u2028","\u2029":"u2029"},D=/\\|'|\r|\n|\t|\u2028|\u2029/g;O.template=function(t,e,n){var i;n=O.defaults({},n,O.templateSettings);var r=new RegExp([(n.escape||T).source,(n.interpolate||T).source,(n.evaluate||T).source].join("|")+"|$","g"),s=0,a="__p+='";t.replace(r,function(e,n,i,r,o){return a+=t.slice(s,o).replace(D,function(t){return"\\"+k[t]}),n&&(a+="'+\n((__t=("+n+"))==null?'':_.escape(__t))+\n'"),i&&(a+="'+\n((__t=("+i+"))==null?'':__t)+\n'"),r&&(a+="';\n"+r+"\n__p+='"),s=o+e.length,e}),a+="';\n",n.variable||(a="with(obj||{}){\n"+a+"}\n"),a="var __t,__p='',__j=Array.prototype.join,print=function(){__p+=__j.call(arguments,'');};\n"+a+"return __p;\n";try{i=new Function(n.variable||"obj","_",a)}catch(o){throw o.source=a,o}if(e)return i(e,O);var u=function(t){return i.call(this,t,O)};return u.source="function("+(n.variable||"obj")+"){\n"+a+"}",u},O.chain=function(t){return O(t).chain()};var q=function(t){return this._chain?O(t).chain():t};O.mixin(O),x(["pop","push","reverse","shift","sort","splice","unshift"],function(t){var e=i[t];O.prototype[t]=function(){var n=this._wrapped;return e.apply(n,arguments),"shift"!=t&&"splice"!=t||0!==n.length||delete n[0],q.call(this,n)}}),x(["concat","join","slice"],function(t){var e=i[t];O.prototype[t]=function(){return q.call(this,e.apply(this._wrapped,arguments))}}),O.extend(O.prototype,{chain:function(){return this._chain=!0,this},value:function(){return this._wrapped}})}.call(this),function(t){t.AV=t.AV||{};var e=t.AV;if("undefined"!=typeof exports&&exports._){e._=exports._.noConflict();try{e.localStorage=require("localStorage")}catch(n){e.localStorage=require("./localStorage.js").localStorage}e.XMLHttpRequest=require("xmlhttprequest").XMLHttpRequest,exports.AV=e}else e._=_.noConflict(),"undefined"!=typeof localStorage&&(e.localStorage=localStorage),"undefined"!=typeof XMLHttpRequest&&(e.XMLHttpRequest=XMLHttpRequest);"undefined"!=typeof $&&(e.$=$);var i=function(){},r=function(t,n,r){var s;return s=n&&n.hasOwnProperty("constructor")?n.constructor:function(){t.apply(this,arguments)},e._.extend(s,t),i.prototype=t.prototype,s.prototype=new i,n&&e._.extend(s.prototype,n),r&&e._.extend(s,r),s.prototype.constructor=s,s.__super__=t.prototype,s};e.serverURL="https://cn.avoscloud.com","undefined"!=typeof process&&process.versions&&process.versions.node&&(e._isNode=!0),e.initialize=function(t,n,i){if(i)throw"AV.initialize() was passed a Master Key, which is only allowed from within Node.js.";e._initialize(t,n,i)},e._initialize=function(t,n,i){e.applicationId=t,e.applicationKey=n,e.masterKey=i,e._useMasterKey=!1},e.setProduction=function(t){e._isNullOrUndefined(t)||(t=t?1:0),e.applicationProduction=e._isNullOrUndefined(t)?1:t},e._isNode&&(e.initialize=e._initialize,e.Cloud=e.Cloud||{},e.Cloud.useMasterKey=function(){e._useMasterKey=!0}),e.useAVCloudCN=function(){e.serverURL="https://cn.avoscloud.com"},e.useAVCloudUS=function(){e.serverURL="https://us.avoscloud.com"},e._getAVPath=function(t){if(!e.applicationId)throw"You need to call AV.initialize before using AV.";if(t||(t=""),!e._.isString(t))throw"Tried to get a localStorage path that wasn't a String.";return"/"===t[0]&&(t=t.substring(1)),"AV/"+e.applicationId+"/"+t},e._installationId=null,e._getInstallationId=function(){if(e._installationId)return e._installationId;var t=e._getAVPath("installationId");if(e._installationId=e.localStorage.getItem(t),!e._installationId||""===e._installationId){var n=function(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)};e._installationId=n()+n()+"-"+n()+"-"+n()+"-"+n()+"-"+n()+n()+n(),e.localStorage.setItem(t,e._installationId)}return e._installationId},e._parseDate=function(t){var e=new RegExp("^([0-9]{1,4})-([0-9]{1,2})-([0-9]{1,2})T([0-9]{1,2}):([0-9]{1,2}):([0-9]{1,2})(.([0-9]+))?Z$"),n=e.exec(t);if(!n)return null;var i=n[1]||0,r=(n[2]||1)-1,s=n[3]||0,a=n[4]||0,o=n[5]||0,u=n[6]||0,c=n[8]||0;return new Date(Date.UTC(i,r,s,a,o,u,c))},e._ajaxIE8=function(t,n,i){var r=new e.Promise,s=new XDomainRequest;return s.onload=function(){var t;try{t=JSON.parse(s.responseText)}catch(e){r.reject(e)}t&&r.resolve(t)},s.onerror=s.ontimeout=function(){r.reject(s)},s.onprogress=function(){},s.open(t,n),s.send(i),r},e._ajax=function(t,n,i,r,s){var a={success:r,error:s};if("undefined"!=typeof XDomainRequest)return e._ajaxIE8(t,n,i)._thenRunCallbacks(a);var o=new e.Promise,u=!1,c=new e.XMLHttpRequest;return c.onreadystatechange=function(){if(4===c.readyState){if(u)return;if(u=!0,c.status>=200&&c.status<300){var t;try{t=JSON.parse(c.responseText)}catch(e){o.reject(e)}t&&o.resolve(t,c.status,c)}else o.reject(c)}},c.open(t,n,!0),c.setRequestHeader("Content-Type","text/plain"),e._isNode&&c.setRequestHeader("User-Agent","AV/"+e.VERSION+" (NodeJS "+process.versions.node+")"),c.send(i),o._thenRunCallbacks(a)},e._extend=function(t,e){var n=r(this,t,e);return n.extend=this.extend,n},e._request=function(t,n,i,r,s){if(!e.applicationId)throw"You must specify your applicationId using AV.initialize";if(!e.applicationKey&&!e.masterKey)throw"You must specify a key using AV.initialize";if("batch"!==t&&"classes"!==t&&"files"!==t&&"functions"!==t&&"login"!==t&&"push"!==t&&"search/select"!==t&&"requestPasswordReset"!==t&&"requestEmailVerify"!==t&&"requestPasswordResetBySmsCode"!==t&&"resetPasswordBySmsCode"!==t&&"requestMobilePhoneVerify"!==t&&"requestLoginSmsCode"!==t&&"verifyMobilePhone"!==t&&"requestSmsCode"!==t&&"verifySmsCode"!==t&&"users"!==t&&"cloudQuery"!==t&&"qiniu"!==t&&"statuses"!==t&&"subscribe/statuses/count"!==t&&"subscribe/statuses"!==t&&!/users\/[^\/]+\/friendship\/[^\/]+/.test(t))throw"Bad route: '"+t+"'.";var a=e.serverURL;"/"!==a.charAt(a.length-1)&&(a+="/"),a+="1.1/"+t,n&&(a+="/"+n),i&&(a+="/"+i),"users"!==t&&"classes"!==t||"PUT"!==r||!s._fetchWhenSave||(delete s._fetchWhenSave,a+="?new=true"),s=e._.clone(s||{}),"POST"!==r&&(s._method=r,r="POST"),s._ApplicationId=e.applicationId,s._ApplicationKey=e.applicationKey,e._isNullOrUndefined(e.applicationProduction)||(s._ApplicationProduction=e.applicationProduction),e._useMasterKey&&(s._MasterKey=e.masterKey),s._ClientVersion=e.VERSION,s._InstallationId=e._getInstallationId();var o=e.User.current();o&&o._sessionToken&&(s._SessionToken=o._sessionToken);var u=JSON.stringify(s);return e._ajax(r,a,u).then(null,function(t){var n;if(t&&t.responseText)try{var i=JSON.parse(t.responseText);i&&(n=new e.Error(i.code,i.error))}catch(r){}return n=n||new e.Error(-1,t.responseText),e.Promise.error(n)})},e._getValue=function(t,n){return t&&t[n]?e._.isFunction(t[n])?t[n]():t[n]:null},e._encode=function(t,n,i){var r=e._;if(t instanceof e.Object){if(i)throw"AV.Objects not allowed here";if(!n||r.include(n,t)||!t._hasData)return t._toPointer();if(!t.dirty())return n=n.concat(t),e._encode(t._toFullJSON(n),n,i);throw"Tried to save an object with a pointer to a new, unsaved object."}if(t instanceof e.ACL)return t.toJSON();if(r.isDate(t))return{__type:"Date",iso:t.toJSON()};if(t instanceof e.GeoPoint)return t.toJSON();if(r.isArray(t))return r.map(t,function(t){return e._encode(t,n,i)});if(r.isRegExp(t))return t.source;if(t instanceof e.Relation)return t.toJSON();if(t instanceof e.Op)return t.toJSON();if(t instanceof e.File){if(!t.url()&&!t.id)throw"Tried to save an object containing an unsaved file.";return{__type:"File",id:t.id,name:t.name(),url:t.url()}}if(r.isObject(t)){var s={};return e._objectEach(t,function(t,r){s[r]=e._encode(t,n,i)}),s}return t},e._decode=function(t,n){var i=e._;if(!i.isObject(n))return n;if(i.isArray(n))return e._arrayEach(n,function(t,i){n[i]=e._decode(i,t)}),n;if(n instanceof e.Object)return n;if(n instanceof e.File)return n;if(n instanceof e.Op)return n;if(n.__op)return e.Op._decode(n);if("Pointer"===n.__type){var r=n.className,s=e.Object._create(r);return n.createdAt?(delete n.__type,delete n.className,s._finishFetch(n,!0)):s._finishFetch({objectId:n.objectId},!1),s}if("Object"===n.__type){var r=n.className;delete n.__type,delete n.className;var a=e.Object._create(r);return a._finishFetch(n,!0),a}if("Date"===n.__type)return e._parseDate(n.iso);if("GeoPoint"===n.__type)return new e.GeoPoint({latitude:n.latitude,longitude:n.longitude});if("ACL"===t)return n instanceof e.ACL?n:new e.ACL(n);if("Relation"===n.__type){var o=new e.Relation(null,t);return o.targetClassName=n.className,o}if("File"===n.__type){var u=new e.File(n.name);return u._metaData=n.metaData||{},u._url=n.url,u.id=n.objectId,u}return e._objectEach(n,function(t,i){n[i]=e._decode(i,t)}),n},e._arrayEach=e._.each,e._traverse=function(t,n,i){if(t instanceof e.Object){if(i=i||[],e._.indexOf(i,t)>=0)return;return i.push(t),e._traverse(t.attributes,n,i),n(t)}return t instanceof e.Relation||t instanceof e.File?n(t):e._.isArray(t)?(e._.each(t,function(r,s){var a=e._traverse(r,n,i);a&&(t[s]=a)}),n(t)):e._.isObject(t)?(e._each(t,function(r,s){var a=e._traverse(r,n,i);a&&(t[s]=a)}),n(t)):n(t)},e._objectEach=e._each=function(t,n){var i=e._;i.isObject(t)?i.each(i.keys(t),function(e){n(t[e],e)}):i.each(t,n)},e._isNullOrUndefined=function(t){return e._.isNull(t)||e._.isUndefined(t)}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Error=function(t,e){this.code=t,this.message=e},n.extend(e.Error,{OTHER_CAUSE:-1,INTERNAL_SERVER_ERROR:1,CONNECTION_FAILED:100,OBJECT_NOT_FOUND:101,INVALID_QUERY:102,INVALID_CLASS_NAME:103,MISSING_OBJECT_ID:104,INVALID_KEY_NAME:105,INVALID_POINTER:106,INVALID_JSON:107,COMMAND_UNAVAILABLE:108,NOT_INITIALIZED:109,INCORRECT_TYPE:111,INVALID_CHANNEL_NAME:112,PUSH_MISCONFIGURED:115,OBJECT_TOO_LARGE:116,OPERATION_FORBIDDEN:119,CACHE_MISS:120,INVALID_NESTED_KEY:121,INVALID_FILE_NAME:122,INVALID_ACL:123,TIMEOUT:124,INVALID_EMAIL_ADDRESS:125,MISSING_CONTENT_TYPE:126,MISSING_CONTENT_LENGTH:127,INVALID_CONTENT_LENGTH:128,FILE_TOO_LARGE:129,FILE_SAVE_ERROR:130,FILE_DELETE_ERROR:153,DUPLICATE_VALUE:137,INVALID_ROLE_NAME:139,EXCEEDED_QUOTA:140,SCRIPT_FAILED:141,VALIDATION_ERROR:142,INVALID_IMAGE_DATA:150,UNSAVED_FILE_ERROR:151,INVALID_PUSH_TIME_ERROR:152,USERNAME_MISSING:200,PASSWORD_MISSING:201,USERNAME_TAKEN:202,EMAIL_TAKEN:203,EMAIL_MISSING:204,EMAIL_NOT_FOUND:205,SESSION_MISSING:206,MUST_CREATE_USER_THROUGH_SIGNUP:207,ACCOUNT_ALREADY_LINKED:208,LINKED_ID_MISSING:250,INVALID_LINKED_SESSION:251,UNSUPPORTED_SERVICE:252})}(this),function(){var t=this,e=t.AV||(t.AV={}),n=/\s+/,i=Array.prototype.slice;e.Events={on:function(t,e,i){var r,s,a,o,u;if(!e)return this;for(t=t.split(n),r=this._callbacks||(this._callbacks={}),s=t.shift();s;)u=r[s],a=u?u.tail:{},a.next=o={},a.context=i,a.callback=e,r[s]={tail:o,next:u?u.next:a},s=t.shift();return this},off:function(t,e,i){var r,s,a,o,u,c;if(s=this._callbacks){if(!(t||e||i))return delete this._callbacks,this;for(t=t?t.split(n):_.keys(s),r=t.shift();r;)if(a=s[r],delete s[r],a&&(e||i)){for(o=a.tail,a=a.next;a!==o;)u=a.callback,c=a.context,(e&&u!==e||i&&c!==i)&&this.on(r,u,c),a=a.next;r=t.shift()}return this}},trigger:function(t){var e,r,s,a,o,u,c;if(!(s=this._callbacks))return this;for(u=s.all,t=t.split(n),c=i.call(arguments,1),e=t.shift();e;){if(r=s[e])for(a=r.tail;(r=r.next)!==a;)r.callback.apply(r.context||this,c);if(r=u)for(a=r.tail,o=[e].concat(c);(r=r.next)!==a;)r.callback.apply(r.context||this,o);e=t.shift()}return this}},e.Events.bind=e.Events.on,e.Events.unbind=e.Events.off}.call(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.GeoPoint=function(t,i){n.isArray(t)?(e.GeoPoint._validate(t[0],t[1]),this.latitude=t[0],this.longitude=t[1]):n.isObject(t)?(e.GeoPoint._validate(t.latitude,t.longitude),this.latitude=t.latitude,this.longitude=t.longitude):n.isNumber(t)&&n.isNumber(i)?(e.GeoPoint._validate(t,i),this.latitude=t,this.longitude=i):(this.latitude=0,this.longitude=0);var r=this;this.__defineGetter__&&this.__defineSetter__&&(this._latitude=this.latitude,this._longitude=this.longitude,this.__defineGetter__("latitude",function(){return r._latitude}),this.__defineGetter__("longitude",function(){return r._longitude}),this.__defineSetter__("latitude",function(t){e.GeoPoint._validate(t,r.longitude),r._latitude=t}),this.__defineSetter__("longitude",function(t){e.GeoPoint._validate(r.latitude,t),r._longitude=t}))},e.GeoPoint._validate=function(t,e){if(-90>t)throw"AV.GeoPoint latitude "+t+" < -90.0.";if(t>90)throw"AV.GeoPoint latitude "+t+" > 90.0.";if(-180>e)throw"AV.GeoPoint longitude "+e+" < -180.0.";if(e>180)throw"AV.GeoPoint longitude "+e+" > 180.0."},e.GeoPoint.current=function(t){var n=new e.Promise;return navigator.geolocation.getCurrentPosition(function(t){n.resolve(new e.GeoPoint({latitude:t.coords.latitude,longitude:t.coords.longitude}))},function(t){n.reject(t)}),n._thenRunCallbacks(t)},e.GeoPoint.prototype={toJSON:function(){return e.GeoPoint._validate(this.latitude,this.longitude),{__type:"GeoPoint",latitude:this.latitude,longitude:this.longitude}},radiansTo:function(t){var e=Math.PI/180,n=this.latitude*e,i=this.longitude*e,r=t.latitude*e,s=t.longitude*e,a=n-r,o=i-s,u=Math.sin(a/2),c=Math.sin(o/2),l=u*u+Math.cos(n)*Math.cos(r)*c*c;return l=Math.min(1,l),2*Math.asin(Math.sqrt(l))},kilometersTo:function(t){return 6371*this.radiansTo(t)},milesTo:function(t){return 3958.8*this.radiansTo(t)}}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._,i="*";e.ACL=function(t){var i=this;if(i.permissionsById={},n.isObject(t))if(t instanceof e.User)i.setReadAccess(t,!0),i.setWriteAccess(t,!0);else{if(n.isFunction(t))throw"AV.ACL() called with a function.  Did you forget ()?";e._objectEach(t,function(t,r){if(!n.isString(r))throw"Tried to create an ACL with an invalid userId.";i.permissionsById[r]={},e._objectEach(t,function(t,e){if("read"!==e&&"write"!==e)throw"Tried to create an ACL with an invalid permission type.";if(!n.isBoolean(t))throw"Tried to create an ACL with an invalid permission value.";i.permissionsById[r][e]=t})})}},e.ACL.prototype.toJSON=function(){return n.clone(this.permissionsById)},e.ACL.prototype._setAccess=function(t,i,r){if(i instanceof e.User?i=i.id:i instanceof e.Role&&(i="role:"+i.getName()),!n.isString(i))throw"userId must be a string.";if(!n.isBoolean(r))throw"allowed must be either true or false.";var s=this.permissionsById[i];if(!s){if(!r)return;s={},this.permissionsById[i]=s}r?this.permissionsById[i][t]=!0:(delete s[t],n.isEmpty(s)&&delete s[i])},e.ACL.prototype._getAccess=function(t,n){n instanceof e.User?n=n.id:n instanceof e.Role&&(n="role:"+n.getName());var i=this.permissionsById[n];return i&&i[t]?!0:!1},e.ACL.prototype.setReadAccess=function(t,e){this._setAccess("read",t,e)},e.ACL.prototype.getReadAccess=function(t){return this._getAccess("read",t)},e.ACL.prototype.setWriteAccess=function(t,e){this._setAccess("write",t,e)},e.ACL.prototype.getWriteAccess=function(t){return this._getAccess("write",t)},e.ACL.prototype.setPublicReadAccess=function(t){this.setReadAccess(i,t)},e.ACL.prototype.getPublicReadAccess=function(){return this.getReadAccess(i)},e.ACL.prototype.setPublicWriteAccess=function(t){this.setWriteAccess(i,t)},e.ACL.prototype.getPublicWriteAccess=function(){return this.getWriteAccess(i)},e.ACL.prototype.getRoleReadAccess=function(t){if(t instanceof e.Role&&(t=t.getName()),n.isString(t))return this.getReadAccess("role:"+t);throw"role must be a AV.Role or a String"},e.ACL.prototype.getRoleWriteAccess=function(t){if(t instanceof e.Role&&(t=t.getName()),n.isString(t))return this.getWriteAccess("role:"+t);throw"role must be a AV.Role or a String"},e.ACL.prototype.setRoleReadAccess=function(t,i){if(t instanceof e.Role&&(t=t.getName()),n.isString(t))return void this.setReadAccess("role:"+t,i);throw"role must be a AV.Role or a String"},e.ACL.prototype.setRoleWriteAccess=function(t,i){if(t instanceof e.Role&&(t=t.getName()),n.isString(t))return void this.setWriteAccess("role:"+t,i);throw"role must be a AV.Role or a String"}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Op=function(){this._initialize.apply(this,arguments)},e.Op.prototype={_initialize:function(){}},n.extend(e.Op,{_extend:e._extend,_opDecoderMap:{},_registerDecoder:function(t,n){e.Op._opDecoderMap[t]=n},_decode:function(t){var n=e.Op._opDecoderMap[t.__op];return n?n(t):void 0}}),e.Op._registerDecoder("Batch",function(t){var n=null;return e._arrayEach(t.ops,function(t){t=e.Op._decode(t),n=t._mergeWithPrevious(n)}),n}),e.Op.Set=e.Op._extend({_initialize:function(t){this._value=t},value:function(){return this._value},toJSON:function(){return e._encode(this.value())},_mergeWithPrevious:function(){return this},_estimate:function(){return this.value()}}),e.Op._UNSET={},e.Op.Unset=e.Op._extend({toJSON:function(){return{__op:"Delete"}},_mergeWithPrevious:function(){return this},_estimate:function(){return e.Op._UNSET}}),e.Op._registerDecoder("Delete",function(){return new e.Op.Unset}),e.Op.Increment=e.Op._extend({_initialize:function(t){this._amount=t},amount:function(){return this._amount},toJSON:function(){return{__op:"Increment",amount:this._amount}},_mergeWithPrevious:function(t){if(t){if(t instanceof e.Op.Unset)return new e.Op.Set(this.amount());if(t instanceof e.Op.Set)return new e.Op.Set(t.value()+this.amount());if(t instanceof e.Op.Increment)return new e.Op.Increment(this.amount()+t.amount());throw"Op is invalid after previous op."}return this},_estimate:function(t){return t?t+this.amount():this.amount()}}),e.Op._registerDecoder("Increment",function(t){return new e.Op.Increment(t.amount)}),e.Op.Add=e.Op._extend({_initialize:function(t){this._objects=t},objects:function(){return this._objects},toJSON:function(){return{__op:"Add",objects:e._encode(this.objects())}},_mergeWithPrevious:function(t){if(t){if(t instanceof e.Op.Unset)return new e.Op.Set(this.objects());if(t instanceof e.Op.Set)return new e.Op.Set(this._estimate(t.value()));if(t instanceof e.Op.Add)return new e.Op.Add(t.objects().concat(this.objects()));throw"Op is invalid after previous op."}return this},_estimate:function(t){return t?t.concat(this.objects()):n.clone(this.objects())}}),e.Op._registerDecoder("Add",function(t){return new e.Op.Add(e._decode(void 0,t.objects))}),e.Op.AddUnique=e.Op._extend({_initialize:function(t){this._objects=n.uniq(t)},objects:function(){return this._objects},toJSON:function(){return{__op:"AddUnique",objects:e._encode(this.objects())}},_mergeWithPrevious:function(t){if(t){if(t instanceof e.Op.Unset)return new e.Op.Set(this.objects());if(t instanceof e.Op.Set)return new e.Op.Set(this._estimate(t.value()));if(t instanceof e.Op.AddUnique)return new e.Op.AddUnique(this._estimate(t.objects()));throw"Op is invalid after previous op."}return this},_estimate:function(t){if(t){var i=n.clone(t);return e._arrayEach(this.objects(),function(t){if(t instanceof e.Object&&t.id){var r=n.find(i,function(n){return n instanceof e.Object&&n.id===t.id});if(r){var s=n.indexOf(i,r);i[s]=t}else i.push(t)}else n.contains(i,t)||i.push(t)}),i}return n.clone(this.objects())}}),e.Op._registerDecoder("AddUnique",function(t){return new e.Op.AddUnique(e._decode(void 0,t.objects))}),e.Op.Remove=e.Op._extend({_initialize:function(t){this._objects=n.uniq(t)},objects:function(){return this._objects},toJSON:function(){return{__op:"Remove",objects:e._encode(this.objects())}},_mergeWithPrevious:function(t){if(t){if(t instanceof e.Op.Unset)return t;if(t instanceof e.Op.Set)return new e.Op.Set(this._estimate(t.value()));if(t instanceof e.Op.Remove)return new e.Op.Remove(n.union(t.objects(),this.objects()));throw"Op is invalid after previous op."}return this},_estimate:function(t){if(t){var i=n.difference(t,this.objects());return e._arrayEach(this.objects(),function(t){t instanceof e.Object&&t.id&&(i=n.reject(i,function(n){return n instanceof e.Object&&n.id===t.id}))}),i}return[]}}),e.Op._registerDecoder("Remove",function(t){return new e.Op.Remove(e._decode(void 0,t.objects))}),e.Op.Relation=e.Op._extend({_initialize:function(t,i){this._targetClassName=null;var r=this,s=function(t){if(t instanceof e.Object){if(!t.id)throw"You can't add an unsaved AV.Object to a relation.";if(r._targetClassName||(r._targetClassName=t.className),r._targetClassName!==t.className)throw"Tried to create a AV.Relation with 2 different types: "+r._targetClassName+" and "+t.className+".";
return t.id}return t};this.relationsToAdd=n.uniq(n.map(t,s)),this.relationsToRemove=n.uniq(n.map(i,s))},added:function(){var t=this;return n.map(this.relationsToAdd,function(n){var i=e.Object._create(t._targetClassName);return i.id=n,i})},removed:function(){var t=this;return n.map(this.relationsToRemove,function(n){var i=e.Object._create(t._targetClassName);return i.id=n,i})},toJSON:function(){var t=null,e=null,i=this,r=function(t){return{__type:"Pointer",className:i._targetClassName,objectId:t}},s=null;return this.relationsToAdd.length>0&&(s=n.map(this.relationsToAdd,r),t={__op:"AddRelation",objects:s}),this.relationsToRemove.length>0&&(s=n.map(this.relationsToRemove,r),e={__op:"RemoveRelation",objects:s}),t&&e?{__op:"Batch",ops:[t,e]}:t||e||{}},_mergeWithPrevious:function(t){if(t){if(t instanceof e.Op.Unset)throw"You can't modify a relation after deleting it.";if(t instanceof e.Op.Relation){if(t._targetClassName&&t._targetClassName!==this._targetClassName)throw"Related object must be of class "+t._targetClassName+", but "+this._targetClassName+" was passed in.";var i=n.union(n.difference(t.relationsToAdd,this.relationsToRemove),this.relationsToAdd),r=n.union(n.difference(t.relationsToRemove,this.relationsToAdd),this.relationsToRemove),s=new e.Op.Relation(i,r);return s._targetClassName=this._targetClassName,s}throw"Op is invalid after previous op."}return this},_estimate:function(t,n,i){if(t){if(t instanceof e.Relation){if(this._targetClassName)if(t.targetClassName){if(t.targetClassName!==this._targetClassName)throw"Related object must be a "+t.targetClassName+", but a "+this._targetClassName+" was passed in."}else t.targetClassName=this._targetClassName;return t}throw"Op is invalid after previous op."}var r=new e.Relation(n,i);r.targetClassName=this._targetClassName}}),e.Op._registerDecoder("AddRelation",function(t){return new e.Op.Relation(e._decode(void 0,t.objects),[])}),e.Op._registerDecoder("RemoveRelation",function(t){return new e.Op.Relation([],e._decode(void 0,t.objects))})}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Relation=function(t,e){this.parent=t,this.key=e,this.targetClassName=null},e.Relation.reverseQuery=function(t,n,i){var r=new e.Query(t);return r.equalTo(n,i._toPointer()),r},e.Relation.prototype={_ensureParentAndKey:function(t,e){if(this.parent=this.parent||t,this.key=this.key||e,this.parent!==t)throw"Internal Error. Relation retrieved from two different Objects.";if(this.key!==e)throw"Internal Error. Relation retrieved from two different keys."},add:function(t){n.isArray(t)||(t=[t]);var i=new e.Op.Relation(t,[]);this.parent.set(this.key,i),this.targetClassName=i._targetClassName},remove:function(t){n.isArray(t)||(t=[t]);var i=new e.Op.Relation([],t);this.parent.set(this.key,i),this.targetClassName=i._targetClassName},toJSON:function(){return{__type:"Relation",className:this.targetClassName}},query:function(){var t,n;return this.targetClassName?(t=e.Object._getSubclass(this.targetClassName),n=new e.Query(t)):(t=e.Object._getSubclass(this.parent.className),n=new e.Query(t),n._extraOptions.redirectClassNameForKey=this.key),n._addCondition("$relatedTo","object",this.parent._toPointer()),n._addCondition("$relatedTo","key",this.key),n}}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Promise=function(){this._resolved=!1,this._rejected=!1,this._resolvedCallbacks=[],this._rejectedCallbacks=[]},n.extend(e.Promise,{is:function(t){return t&&t.then&&n.isFunction(t.then)},as:function(){var t=new e.Promise;return t.resolve.apply(t,arguments),t},error:function(){var t=new e.Promise;return t.reject.apply(t,arguments),t},when:function(t){var n;n=t&&e._isNullOrUndefined(t.length)?arguments:t;var i=n.length,r=!1,s=[],a=[];if(s.length=n.length,a.length=n.length,0===i)return e.Promise.as.apply(this,s);var o=new e.Promise,u=function(){i-=1,0===i&&(r?o.reject(a):o.resolve.apply(o,s))};return e._arrayEach(n,function(t,n){e.Promise.is(t)?t.then(function(t){s[n]=t,u()},function(t){a[n]=t,r=!0,u()}):(s[n]=t,u())}),o},_continueWhile:function(t,n){return t()?n().then(function(){return e.Promise._continueWhile(t,n)}):e.Promise.as()}}),n.extend(e.Promise.prototype,{resolve:function(){if(this._resolved||this._rejected)throw"A promise was resolved even though it had already been "+(this._resolved?"resolved":"rejected")+".";this._resolved=!0,this._result=arguments;var t=arguments;e._arrayEach(this._resolvedCallbacks,function(e){e.apply(this,t)}),this._resolvedCallbacks=[],this._rejectedCallbacks=[]},reject:function(t){if(this._resolved||this._rejected)throw"A promise was rejected even though it had already been "+(this._resolved?"resolved":"rejected")+".";this._rejected=!0,this._error=t,e._arrayEach(this._rejectedCallbacks,function(e){e(t)}),this._resolvedCallbacks=[],this._rejectedCallbacks=[]},then:function(t,n){var i=new e.Promise,r=function(){var n=arguments;t&&(n=[t.apply(this,n)]),1===n.length&&e.Promise.is(n[0])?n[0].then(function(){i.resolve.apply(i,arguments)},function(t){i.reject(t)}):i.resolve.apply(i,n)},s=function(t){var r=[];n?(r=[n(t)],1===r.length&&e.Promise.is(r[0])?r[0].then(function(){i.resolve.apply(i,arguments)},function(t){i.reject(t)}):i.reject(r[0])):i.reject(t)};return this._resolved?r.apply(this,this._result):this._rejected?s(this._error):(this._resolvedCallbacks.push(r),this._rejectedCallbacks.push(s)),i},_thenRunCallbacks:function(t,i){var r;if(n.isFunction(t)){var s=t;r={success:function(t){s(t,null)},error:function(t){s(null,t)}}}else r=n.clone(t);return r=r||{},this.then(function(t){return r.success?r.success.apply(this,arguments):i&&i.trigger("sync",i,t,r),e.Promise.as.apply(e.Promise,arguments)},function(t){return r.error?n.isUndefined(i)?r.error(t):r.error(i,t):i&&i.trigger("error",i,t,r),e.Promise.error(t)})},_continueWith:function(t){return this.then(function(){return t(arguments,null)},function(e){return t(null,e)})}})}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._,i=function(t){if(26>t)return String.fromCharCode(65+t);if(52>t)return String.fromCharCode(97+(t-26));if(62>t)return String.fromCharCode(48+(t-52));if(62===t)return"+";if(63===t)return"/";throw"Tried to encode large digit "+t+" in base64."},r=function(t){var e=[];return e.length=Math.ceil(t.length/3),n.times(e.length,function(n){var r=t[3*n],s=t[3*n+1]||0,a=t[3*n+2]||0,o=3*n+1<t.length,u=3*n+2<t.length;e[n]=[i(r>>2&63),i(r<<4&48|s>>4&15),o?i(s<<2&60|a>>6&3):"=",u?i(63&a):"="].join("")}),e.join("")},s={ai:"application/postscript",aif:"audio/x-aiff",aifc:"audio/x-aiff",aiff:"audio/x-aiff",asc:"text/plain",atom:"application/atom+xml",au:"audio/basic",avi:"video/x-msvideo",bcpio:"application/x-bcpio",bin:"application/octet-stream",bmp:"image/bmp",cdf:"application/x-netcdf",cgm:"image/cgm","class":"application/octet-stream",cpio:"application/x-cpio",cpt:"application/mac-compactpro",csh:"application/x-csh",css:"text/css",dcr:"application/x-director",dif:"video/x-dv",dir:"application/x-director",djv:"image/vnd.djvu",djvu:"image/vnd.djvu",dll:"application/octet-stream",dmg:"application/octet-stream",dms:"application/octet-stream",doc:"application/msword",docx:"application/vnd.openxmlformats-officedocument.wordprocessingml.document",dotx:"application/vnd.openxmlformats-officedocument.wordprocessingml.template",docm:"application/vnd.ms-word.document.macroEnabled.12",dotm:"application/vnd.ms-word.template.macroEnabled.12",dtd:"application/xml-dtd",dv:"video/x-dv",dvi:"application/x-dvi",dxr:"application/x-director",eps:"application/postscript",etx:"text/x-setext",exe:"application/octet-stream",ez:"application/andrew-inset",gif:"image/gif",gram:"application/srgs",grxml:"application/srgs+xml",gtar:"application/x-gtar",hdf:"application/x-hdf",hqx:"application/mac-binhex40",htm:"text/html",html:"text/html",ice:"x-conference/x-cooltalk",ico:"image/x-icon",ics:"text/calendar",ief:"image/ief",ifb:"text/calendar",iges:"model/iges",igs:"model/iges",jnlp:"application/x-java-jnlp-file",jp2:"image/jp2",jpe:"image/jpeg",jpeg:"image/jpeg",jpg:"image/jpeg",js:"application/x-javascript",kar:"audio/midi",latex:"application/x-latex",lha:"application/octet-stream",lzh:"application/octet-stream",m3u:"audio/x-mpegurl",m4a:"audio/mp4a-latm",m4b:"audio/mp4a-latm",m4p:"audio/mp4a-latm",m4u:"video/vnd.mpegurl",m4v:"video/x-m4v",mac:"image/x-macpaint",man:"application/x-troff-man",mathml:"application/mathml+xml",me:"application/x-troff-me",mesh:"model/mesh",mid:"audio/midi",midi:"audio/midi",mif:"application/vnd.mif",mov:"video/quicktime",movie:"video/x-sgi-movie",mp2:"audio/mpeg",mp3:"audio/mpeg",mp4:"video/mp4",mpe:"video/mpeg",mpeg:"video/mpeg",mpg:"video/mpeg",mpga:"audio/mpeg",ms:"application/x-troff-ms",msh:"model/mesh",mxu:"video/vnd.mpegurl",nc:"application/x-netcdf",oda:"application/oda",ogg:"application/ogg",pbm:"image/x-portable-bitmap",pct:"image/pict",pdb:"chemical/x-pdb",pdf:"application/pdf",pgm:"image/x-portable-graymap",pgn:"application/x-chess-pgn",pic:"image/pict",pict:"image/pict",png:"image/png",pnm:"image/x-portable-anymap",pnt:"image/x-macpaint",pntg:"image/x-macpaint",ppm:"image/x-portable-pixmap",ppt:"application/vnd.ms-powerpoint",pptx:"application/vnd.openxmlformats-officedocument.presentationml.presentation",potx:"application/vnd.openxmlformats-officedocument.presentationml.template",ppsx:"application/vnd.openxmlformats-officedocument.presentationml.slideshow",ppam:"application/vnd.ms-powerpoint.addin.macroEnabled.12",pptm:"application/vnd.ms-powerpoint.presentation.macroEnabled.12",potm:"application/vnd.ms-powerpoint.template.macroEnabled.12",ppsm:"application/vnd.ms-powerpoint.slideshow.macroEnabled.12",ps:"application/postscript",qt:"video/quicktime",qti:"image/x-quicktime",qtif:"image/x-quicktime",ra:"audio/x-pn-realaudio",ram:"audio/x-pn-realaudio",ras:"image/x-cmu-raster",rdf:"application/rdf+xml",rgb:"image/x-rgb",rm:"application/vnd.rn-realmedia",roff:"application/x-troff",rtf:"text/rtf",rtx:"text/richtext",sgm:"text/sgml",sgml:"text/sgml",sh:"application/x-sh",shar:"application/x-shar",silo:"model/mesh",sit:"application/x-stuffit",skd:"application/x-koan",skm:"application/x-koan",skp:"application/x-koan",skt:"application/x-koan",smi:"application/smil",smil:"application/smil",snd:"audio/basic",so:"application/octet-stream",spl:"application/x-futuresplash",src:"application/x-wais-source",sv4cpio:"application/x-sv4cpio",sv4crc:"application/x-sv4crc",svg:"image/svg+xml",swf:"application/x-shockwave-flash",t:"application/x-troff",tar:"application/x-tar",tcl:"application/x-tcl",tex:"application/x-tex",texi:"application/x-texinfo",texinfo:"application/x-texinfo",tif:"image/tiff",tiff:"image/tiff",tr:"application/x-troff",tsv:"text/tab-separated-values",txt:"text/plain",ustar:"application/x-ustar",vcd:"application/x-cdlink",vrml:"model/vrml",vxml:"application/voicexml+xml",wav:"audio/x-wav",wbmp:"image/vnd.wap.wbmp",wbmxl:"application/vnd.wap.wbxml",wml:"text/vnd.wap.wml",wmlc:"application/vnd.wap.wmlc",wmls:"text/vnd.wap.wmlscript",wmlsc:"application/vnd.wap.wmlscriptc",wrl:"model/vrml",xbm:"image/x-xbitmap",xht:"application/xhtml+xml",xhtml:"application/xhtml+xml",xls:"application/vnd.ms-excel",xml:"application/xml",xpm:"image/x-xpixmap",xsl:"application/xml",xlsx:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",xltx:"application/vnd.openxmlformats-officedocument.spreadsheetml.template",xlsm:"application/vnd.ms-excel.sheet.macroEnabled.12",xltm:"application/vnd.ms-excel.template.macroEnabled.12",xlam:"application/vnd.ms-excel.addin.macroEnabled.12",xlsb:"application/vnd.ms-excel.sheet.binary.macroEnabled.12",xslt:"application/xslt+xml",xul:"application/vnd.mozilla.xul+xml",xwd:"image/x-xwindowdump",xyz:"chemical/x-xyz",zip:"application/zip"},a=function(t,n){var i=new e.Promise;if("undefined"==typeof FileReader)return e.Promise.error(new e.Error(-1,"Attempted to use a FileReader on an unsupported browser."));var r=new FileReader;return r.onloadend=function(){if(2!==r.readyState)return void i.reject(new e.Error(-1,"Error reading file."));var t=r.result,s=/^data:([^;]*);base64,(.*)$/.exec(t);return s?void i.resolve(s[2],n||s[1]):void i.reject(new e.Error(-1,"Unable to interpret data URL: "+t))},r.readAsDataURL(t),i};e.File=function(t,i,o){this._name=t;var u=e.User.current();this._metaData={owner:null!=u?u.id:"unknown"};var c=/\.([^.]*)$/.exec(t);c&&(c=c[1].toLowerCase());var l=o||s[c]||"text/plain";if(this._guessedType=l,n.isArray(i))this._source=e.Promise.as(r(i),l),this._metaData.size=i.length;else if(i&&i.base64)this._source=e.Promise.as(i.base64,l);else if("undefined"!=typeof File&&i instanceof File)this._source=a(i,o);else if(e._isNode&&Buffer.isBuffer(i))this._source=e.Promise.as(i.toString("base64"),l),this._metaData.size=i.length;else if(n.isString(i))throw"Creating a AV.File from a String is not yet supported."},e.File.withURL=function(t,n,i,r){if(!t||!n)throw"Please provide file name and url";var s=new e.File(t,null,r);if(i)for(var a in i)s._metaData[a]||(s._metaData[a]=i[a]);return s._url=n,s._metaData.__source="external",s},e.File.createWithoutData=function(t){var n=new e.File;return n.id=t,n},e.File.prototype={getACL:function(){return this._acl},setACL:function(t){return t instanceof e.ACL?void(this._acl=t):new e.Error(e.Error.OTHER_CAUSE,"ACL must be a AV.ACL.")},name:function(){return this._name},url:function(){return this._url},metaData:function(t,e){return null!=t&&null!=e?(this._metaData[t]=e,this):null!=t?this._metaData[t]:this._metaData},thumbnailURL:function(t,e,n,i,r){if(!this.url())throw"Invalid url.";if(!t||!e||0>=t||0>=e)throw"Invalid width or height value.";if(n=n||100,i=null==i?!0:i,0>=n||n>100)throw"Invalid quality value.";r=r||"png";var s=i?2:1;return this.url()+"?imageView/"+s+"/w/"+t+"/h/"+e+"/q/"+n+"/format/"+r},size:function(){return this.metaData().size},ownerId:function(){return this.metaData().owner},destroy:function(t){if(!this.id)return e.Promise.error("The file id is not eixsts.")._thenRunCallbacks(t);var n=e._request("files",null,this.id,"DELETE");return n._thenRunCallbacks(t)},save:function(t){var n=this;if(!n._previousSave)if(n._source)if(e._isNode){var i=require("qiniu");n._previousSave=n._source.then(function(t,i){var r=function(){return Math.floor(65536*(1+Math.random())).toString(16).substring(1)},s=r()+r()+r()+r(),a={key:s,ACL:n._acl,name:n._name,mime_type:i,metaData:n._metaData};return i&&null==n._metaData.mime_type&&(n._metaData.mime_type=i),n._qiniu_key=s,n._base64=t,e._request("qiniu",null,null,"POST",a)}).then(function(t){n._url=t.url,n._bucket=t.bucket,n.id=t.objectId;var r=t.token,s=new e.Promise,a=new i.io.PutExtra;n._metaData.mime_type&&(a.mimeType=n._metaData.mime_type);var o=new Buffer(n._base64,"base64");return i.io.put(r,n._qiniu_key,o,a,function(t){delete n._qiniu_key,delete n._base64,t?(s.reject(t),n.destroy()):s.resolve(n)}),s})}else n._previousSave=n._source.then(function(t,i){var r={base64:t,_ContentType:i,ACL:n._acl,mime_type:i,metaData:n._metaData};return e._request("files",n._name,null,"POST",r)}).then(function(t){return n._name=t.name,n._url=t.url,n.id=t.objectId,t.size&&(n._metaData.size=t.size),n});else if(n._url&&"external"==n._metaData.__source){var r={name:n._name,ACL:n._acl,metaData:n._metaData,mime_type:n._guessedType,url:n._url};n._previousSave=e._request("files",n._name,null,"POST",r).then(function(t){return n._name=t.name,n._url=t.url,n.id=t.objectId,t.size&&(n._metaData.size=t.size),n})}return n._previousSave._thenRunCallbacks(t)}}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Object=function(t,i){if(n.isString(t))return e.Object._create.apply(this,arguments);t=t||{},i&&i.parse&&(t=this.parse(t));var r=e._getValue(this,"defaults");if(r&&(t=n.extend({},r,t)),i&&i.collection&&(this.collection=i.collection),this._serverData={},this._opSetQueue=[{}],this.attributes={},this._hashedJSON={},this._escapedAttributes={},this.cid=n.uniqueId("c"),this.changed={},this._silent={},this._pending={},!this.set(t,{silent:!0}))throw new Error("Can't create an invalid AV.Object");this.changed={},this._silent={},this._pending={},this._hasData=!0,this._previousAttributes=n.clone(this.attributes),this.initialize.apply(this,arguments)},e.Object.saveAll=function(t,n){return e.Object._deepSaveAsync(t)._thenRunCallbacks(n)},n.extend(e.Object.prototype,e.Events,{_existed:!1,_fetchWhenSave:!1,initialize:function(){},fetchWhenSave:function(t){if(!n.isBoolean(t))throw"Expect boolean value for fetchWhenSave";this._fetchWhenSave=t},toJSON:function(){var t=this._toFullJSON();return e._arrayEach(["__type","className"],function(e){delete t[e]}),t},_toFullJSON:function(t){var i=n.clone(this.attributes);return e._objectEach(i,function(n,r){i[r]=e._encode(n,t)}),e._objectEach(this._operations,function(t,e){i[e]=t}),n.has(this,"id")&&(i.objectId=this.id),n.has(this,"createdAt")&&(i.createdAt=n.isDate(this.createdAt)?this.createdAt.toJSON():this.createdAt),n.has(this,"updatedAt")&&(i.updatedAt=n.isDate(this.updatedAt)?this.updatedAt.toJSON():this.updatedAt),i.__type="Object",i.className=this.className,i},_refreshCache:function(){var t=this;t._refreshingCache||(t._refreshingCache=!0,e._objectEach(this.attributes,function(i,r){i instanceof e.Object?i._refreshCache():n.isObject(i)&&t._resetCacheForKey(r)&&t.set(r,new e.Op.Set(i),{silent:!0})}),delete t._refreshingCache)},dirty:function(t){this._refreshCache();var e=n.last(this._opSetQueue);return t?e[t]?!0:!1:this.id?n.keys(e).length>0?!0:!1:!0},_toPointer:function(){return{__type:"Pointer",className:this.className,objectId:this.id}},get:function(t){return this.attributes[t]},relation:function(t){var n=this.get(t);if(n){if(!(n instanceof e.Relation))throw"Called relation() on non-relation field "+t;return n._ensureParentAndKey(this,t),n}return new e.Relation(this,t)},escape:function(t){var i=this._escapedAttributes[t];if(i)return i;var r,s=this.attributes[t];return r=e._isNullOrUndefined(s)?"":n.escape(s.toString()),this._escapedAttributes[t]=r,r},has:function(t){return!e._isNullOrUndefined(this.attributes[t])},_mergeMagicFields:function(t){var i=this,r=["id","objectId","createdAt","updatedAt"];e._arrayEach(r,function(r){t[r]&&("objectId"===r?i.id=t[r]:i[r]="createdAt"!==r&&"updatedAt"!==r||n.isDate(t[r])?t[r]:e._parseDate(t[r]),delete t[r])})},_startSave:function(){this._opSetQueue.push({})},_cancelSave:function(){var t=n.first(this._opSetQueue);this._opSetQueue=n.rest(this._opSetQueue);var i=n.first(this._opSetQueue);e._objectEach(t,function(e,n){var r=t[n],s=i[n];r&&s?i[n]=s._mergeWithPrevious(r):r&&(i[n]=r)}),this._saving=this._saving-1},_finishSave:function(t){var i={};e._traverse(this.attributes,function(t){t instanceof e.Object&&t.id&&t._hasData&&(i[t.id]=t)});var r=n.first(this._opSetQueue);this._opSetQueue=n.rest(this._opSetQueue),this._applyOpSet(r,this._serverData),this._mergeMagicFields(t);var s=this;e._objectEach(t,function(t,n){s._serverData[n]=e._decode(n,t);var r=e._traverse(s._serverData[n],function(t){return t instanceof e.Object&&i[t.id]?i[t.id]:void 0});r&&(s._serverData[n]=r)}),this._rebuildAllEstimatedData(),this._saving=this._saving-1},_finishFetch:function(t,n){this._opSetQueue=[{}],this._mergeMagicFields(t);var i=this;e._objectEach(t,function(t,n){i._serverData[n]=e._decode(n,t)}),this._rebuildAllEstimatedData(),this._refreshCache(),this._opSetQueue=[{}],this._hasData=n},_applyOpSet:function(t,n){var i=this;e._objectEach(t,function(t,r){n[r]=t._estimate(n[r],i,r),n[r]===e.Op._UNSET&&delete n[r]})},_resetCacheForKey:function(t){var i=this.attributes[t];if(!(!n.isObject(i)||i instanceof e.Object||i instanceof e.File)){i=i.toJSON?i.toJSON():i;var r=JSON.stringify(i);if(this._hashedJSON[t]!==r)return this._hashedJSON[t]=r,!0}return!1},_rebuildEstimatedDataForKey:function(t){var n=this;delete this.attributes[t],this._serverData[t]&&(this.attributes[t]=this._serverData[t]),e._arrayEach(this._opSetQueue,function(i){var r=i[t];r&&(n.attributes[t]=r._estimate(n.attributes[t],n,t),n.attributes[t]===e.Op._UNSET?delete n.attributes[t]:n._resetCacheForKey(t))})},_rebuildAllEstimatedData:function(){var t=this,i=n.clone(this.attributes);this.attributes=n.clone(this._serverData),e._arrayEach(this._opSetQueue,function(n){t._applyOpSet(n,t.attributes),e._objectEach(n,function(e,n){t._resetCacheForKey(n)})}),e._objectEach(i,function(e,n){t.attributes[n]!==e&&t.trigger("change:"+n,t,t.attributes[n],{})}),e._objectEach(this.attributes,function(e,r){n.has(i,r)||t.trigger("change:"+r,t,e,{})})},set:function(t,i,r){var s;if(n.isObject(t)||e._isNullOrUndefined(t)?(s=t,e._objectEach(s,function(t,n){s[n]=e._decode(n,t)}),r=i):(s={},s[t]=e._decode(t,i)),r=r||{},!s)return this;s instanceof e.Object&&(s=s.attributes),r.unset&&e._objectEach(s,function(t,n){s[n]=new e.Op.Unset});var a=n.clone(s),o=this;if(e._objectEach(a,function(t,n){t instanceof e.Op&&(a[n]=t._estimate(o.attributes[n],o,n),a[n]===e.Op._UNSET&&delete a[n])}),!this._validate(s,r))return!1;this._mergeMagicFields(s),r.changes={};{var u=this._escapedAttributes;this._previousAttributes||{}}return e._arrayEach(n.keys(s),function(t){var i=s[t];i instanceof e.Relation&&(i.parent=o),i instanceof e.Op||(i=new e.Op.Set(i));var a=!0;i instanceof e.Op.Set&&n.isEqual(o.attributes[t],i.value)&&(a=!1),a&&(delete u[t],r.silent?o._silent[t]=!0:r.changes[t]=!0);var c=n.last(o._opSetQueue);c[t]=i._mergeWithPrevious(c[t]),o._rebuildEstimatedDataForKey(t),a?(o.changed[t]=o.attributes[t],r.silent||(o._pending[t]=!0)):(delete o.changed[t],delete o._pending[t])}),r.silent||this.change(r),this},unset:function(t,e){return e=e||{},e.unset=!0,this.set(t,null,e)},increment:function(t,i){return(n.isUndefined(i)||n.isNull(i))&&(i=1),this.set(t,new e.Op.Increment(i))},add:function(t,n){return this.set(t,new e.Op.Add([n]))},addUnique:function(t,n){return this.set(t,new e.Op.AddUnique([n]))},remove:function(t,n){return this.set(t,new e.Op.Remove([n]))},op:function(t){return n.last(this._opSetQueue)[t]},clear:function(t){t=t||{},t.unset=!0;var e=n.extend(this.attributes,this._operations);return this.set(e,t)},_getSaveJSON:function(){var t=n.clone(n.first(this._opSetQueue));return e._objectEach(t,function(e,n){t[n]=e.toJSON()}),t},_canBeSerialized:function(){return e.Object._canBeSerializedAsValue(this.attributes)},fetch:function(t){var n=this,i=e._request("classes",this.className,this.id,"GET");return i.then(function(t,e,i){return n._finishFetch(n.parse(t,e,i),!0),n})._thenRunCallbacks(t,this)},save:function(t,i,r){var s,a,o;if(n.isObject(t)||e._isNullOrUndefined(t)?(s=t,o=i):(s={},s[t]=i,o=r),!o&&s){var u=n.reject(s,function(t,e){return n.include(["success","error","wait"],e)});if(0===u.length){var c=!0;if(n.has(s,"success")&&!n.isFunction(s.success)&&(c=!1),n.has(s,"error")&&!n.isFunction(s.error)&&(c=!1),c)return this.save(null,s)}}o=n.clone(o)||{},o.wait&&(a=n.clone(this.attributes));var l=n.clone(o)||{};l.wait&&(l.silent=!0);var h;if(l.error=function(t,e){h=e},s&&!this.set(s,l))return e.Promise.error(h)._thenRunCallbacks(o,this);var d=this;d._refreshCache();var f=[],p=[];return e.Object._findUnsavedChildren(d.attributes,f,p),f.length+p.length>0?e.Object._deepSaveAsync(this.attributes,d).then(function(){return d.save(null,o)},function(t){return e.Promise.error(t)._thenRunCallbacks(o,d)}):(this._startSave(),this._saving=(this._saving||0)+1,this._allPreviousSaves=this._allPreviousSaves||e.Promise.as(),this._allPreviousSaves=this._allPreviousSaves._continueWith(function(){var t=d.id?"PUT":"POST",i=d._getSaveJSON();"PUT"===t&&d._fetchWhenSave&&(i._fetchWhenSave=!0);var r="classes",u=d.className;"_User"!==d.className||d.id||(r="users",u=null);var c=e._request(r,u,d.id,t,i);return c=c.then(function(t,e,i){var r=d.parse(t,e,i);return o.wait&&(r=n.extend(s||{},r)),d._finishSave(r),o.wait&&d.set(a,l),d},function(t){return d._cancelSave(),e.Promise.error(t)})._thenRunCallbacks(o,d)}),this._allPreviousSaves)},destroy:function(t){t=t||{};var n=this,i=function(){n.trigger("destroy",n,n.collection,t)};if(!this.id)return i();t.wait||i();var r=e._request("classes",this.className,this.id,"DELETE");return r.then(function(){return t.wait&&i(),n})._thenRunCallbacks(t,this)},parse:function(t,i){var r=n.clone(t);return n(["createdAt","updatedAt"]).each(function(t){r[t]&&(r[t]=e._parseDate(r[t]))}),r.updatedAt||(r.updatedAt=r.createdAt),i&&(this._existed=201!==i),r},clone:function(){return new this.constructor(this.attributes)},isNew:function(){return!this.id},change:function(t){t=t||{};var i=this._changing;this._changing=!0;var r=this;e._objectEach(this._silent,function(t){r._pending[t]=!0});var s=n.extend({},t.changes,this._silent);if(this._silent={},e._objectEach(s,function(e,n){r.trigger("change:"+n,r,r.get(n),t)}),i)return this;for(var a=function(t,e){r._pending[e]||r._silent[e]||delete r.changed[e]};!n.isEmpty(this._pending);)this._pending={},this.trigger("change",this,t),e._objectEach(this.changed,a),r._previousAttributes=n.clone(this.attributes);return this._changing=!1,this},existed:function(){return this._existed},hasChanged:function(t){return arguments.length?this.changed&&n.has(this.changed,t):!n.isEmpty(this.changed)},changedAttributes:function(t){if(!t)return this.hasChanged()?n.clone(this.changed):!1;var i={},r=this._previousAttributes;return e._objectEach(t,function(t,e){n.isEqual(r[e],t)||(i[e]=t)}),i},previous:function(t){return arguments.length&&this._previousAttributes?this._previousAttributes[t]:null},previousAttributes:function(){return n.clone(this._previousAttributes)},isValid:function(){return!this.validate(this.attributes)},validate:function(t){return!n.has(t,"ACL")||t.ACL instanceof e.ACL?!1:new e.Error(e.Error.OTHER_CAUSE,"ACL must be a AV.ACL.")},_validate:function(t,e){if(e.silent||!this.validate)return!0;t=n.extend({},this.attributes,t);var i=this.validate(t,e);return i?(e&&e.error?e.error(this,i,e):this.trigger("error",this,i,e),!1):!0},getACL:function(){return this.get("ACL")},setACL:function(t,e){return this.set("ACL",t,e)}}),e.Object.createWithoutData=function(t,n,i){var r=new e.Object(t);return r.id=n,r._hasData=i,r},e.Object.destroyAll=function(t,n){if(null==t||0==t.length)return e.Promise.as()._thenRunCallbacks(n);var i=t[0].className,r="",s=!0;t.forEach(function(t){if(t.className!=i)throw"AV.Object.destroyAll requires the argument object array's classNames must be the same";if(!t.id)throw"Could not delete unsaved object";s?(r=t.id,s=!1):r=r+","+t.id});var a=e._request("classes",i,r,"DELETE");return a._thenRunCallbacks(n)},e.Object._getSubclass=function(t){if(!n.isString(t))throw"AV.Object._getSubclass requires a string argument.";var i=e.Object._classMap[t];return i||(i=e.Object.extend(t),e.Object._classMap[t]=i),i},e.Object._create=function(t,n,i){var r=e.Object._getSubclass(t);return new r(n,i)},e.Object._classMap={},e.Object._extend=e._extend,e.Object.new=function(t,n){return new e.Object(t,n)},e.Object.extend=function(t,i,r){if(!n.isString(t)){if(t&&n.has(t,"className"))return e.Object.extend(t.className,t,i);throw new Error("AV.Object.extend's first argument should be the className.")}"User"===t&&(t="_User");var s=null;if(n.has(e.Object._classMap,t)){var a=e.Object._classMap[t];s=a._extend(i,r)}else i=i||{},i.className=t,s=this._extend(i,r);return s.extend=function(i){if(n.isString(i)||i&&n.has(i,"className"))return e.Object.extend.apply(s,arguments);var r=[t].concat(e._.toArray(arguments));return e.Object.extend.apply(s,r)},s.new=function(t,e){return new s(t,e)},e.Object._classMap[t]=s,s},e.Object._findUnsavedChildren=function(t,n,i){e._traverse(t,function(t){return t instanceof e.Object?(t._refreshCache(),void(t.dirty()&&n.push(t))):t instanceof e.File?void(t.url()||t.id||i.push(t)):void 0})},e.Object._canBeSerializedAsValue=function(t){var i=!0;return t instanceof e.Object?i=!!t.id:n.isArray(t)?e._arrayEach(t,function(t){e.Object._canBeSerializedAsValue(t)||(i=!1)}):n.isObject(t)&&e._objectEach(t,function(t){e.Object._canBeSerializedAsValue(t)||(i=!1)}),i},e.Object._deepSaveAsync=function(t,i){var r=[],s=[];e.Object._findUnsavedChildren(t,r,s),i&&(r=n.filter(r,function(t){return t!=i}));var a=e.Promise.as();n.each(s,function(t){a=a.then(function(){return t.save()})});var o=n.uniq(r),u=n.uniq(o);return a.then(function(){return e.Promise._continueWhile(function(){return u.length>0},function(){var t=[],i=[];if(e._arrayEach(u,function(e){return t.length>20?void i.push(e):void(e._canBeSerialized()?t.push(e):i.push(e))}),u=i,0===t.length)return e.Promise.error(new e.Error(e.Error.OTHER_CAUSE,"Tried to save a batch with a cycle."));var r=e.Promise.when(n.map(t,function(t){return t._allPreviousSaves||e.Promise.as()})),s=new e.Promise;return e._arrayEach(t,function(t){t._allPreviousSaves=s}),r._continueWith(function(){return e._request("batch",null,null,"POST",{requests:n.map(t,function(t){var e=t._getSaveJSON(),n="POST",i="/1.1/classes/"+t.className;return t.id&&(i=i+"/"+t.id,n="PUT"),t._startSave(),{method:n,path:i,body:e}})}).then(function(n,i,r){var s;return e._arrayEach(t,function(t,e){n[e].success?t._finishSave(t.parse(n[e].success,i,r)):(s=s||n[e].error,t._cancelSave())}),s?e.Promise.error(new e.Error(s.code,s.error)):void 0}).then(function(t){return s.resolve(t),t},function(t){return s.reject(t),e.Promise.error(t)})})})}).then(function(){return t})}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Role=e.Object.extend("_Role",{constructor:function(t,i){n.isString(t)&&i instanceof e.ACL?(e.Object.prototype.constructor.call(this,null,null),this.setName(t),this.setACL(i)):e.Object.prototype.constructor.call(this,t,i)},getName:function(){return this.get("name")},setName:function(t,e){return this.set("name",t,e)},getUsers:function(){return this.relation("users")},getRoles:function(){return this.relation("roles")},validate:function(t,i){if("name"in t&&t.name!==this.getName()){var r=t.name;if(this.id&&this.id!==t.objectId)return new e.Error(e.Error.OTHER_CAUSE,"A role's name can only be set before it has been saved.");if(!n.isString(r))return new e.Error(e.Error.OTHER_CAUSE,"A role's name must be a String.");if(!/^[0-9a-zA-Z\-_ ]+$/.test(r))return new e.Error(e.Error.OTHER_CAUSE,"A role's name can only contain alphanumeric characters, _, -, and spaces.")}return e.Object.prototype.validate?e.Object.prototype.validate.call(this,t,i):!1}})}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Collection=function(t,e){e=e||{},e.comparator&&(this.comparator=e.comparator),e.model&&(this.model=e.model),e.query&&(this.query=e.query),this._reset(),this.initialize.apply(this,arguments),t&&this.reset(t,{silent:!0,parse:e.parse})},n.extend(e.Collection.prototype,e.Events,{model:e.Object,initialize:function(){},toJSON:function(){return this.map(function(t){return t.toJSON()})},add:function(t,i){var r,s,a,o,u,c,l={},h={};for(i=i||{},t=n.isArray(t)?t.slice():[t],r=0,a=t.length;a>r;r++){if(t[r]=this._prepareModel(t[r],i),o=t[r],!o)throw new Error("Can't add an invalid model to a collection");if(u=o.cid,l[u]||this._byCid[u])throw new Error("Duplicate cid: can't add the same model to a collection twice");if(c=o.id,!e._isNullOrUndefined(c)&&(h[c]||this._byId[c]))throw new Error("Duplicate id: can't add the same model to a collection twice");h[c]=o,l[u]=o}for(r=0;a>r;r++)(o=t[r]).on("all",this._onModelEvent,this),this._byCid[o.cid]=o,o.id&&(this._byId[o.id]=o);if(this.length+=a,s=e._isNullOrUndefined(i.at)?this.models.length:i.at,this.models.splice.apply(this.models,[s,0].concat(t)),this.comparator&&this.sort({silent:!0}),i.silent)return this;for(r=0,a=this.models.length;a>r;r++)o=this.models[r],l[o.cid]&&(i.index=r,o.trigger("add",o,this,i));return this},remove:function(t,e){var i,r,s,a;for(e=e||{},t=n.isArray(t)?t.slice():[t],i=0,r=t.length;r>i;i++)a=this.getByCid(t[i])||this.get(t[i]),a&&(delete this._byId[a.id],delete this._byCid[a.cid],s=this.indexOf(a),this.models.splice(s,1),this.length--,e.silent||(e.index=s,a.trigger("remove",a,this,e)),this._removeReference(a));return this},get:function(t){return t&&this._byId[t.id||t]},getByCid:function(t){return t&&this._byCid[t.cid||t]},at:function(t){return this.models[t]},sort:function(t){if(t=t||{},!this.comparator)throw new Error("Cannot sort a set without a comparator");
var e=n.bind(this.comparator,this);return 1===this.comparator.length?this.models=this.sortBy(e):this.models.sort(e),t.silent||this.trigger("reset",this,t),this},pluck:function(t){return n.map(this.models,function(e){return e.get(t)})},reset:function(t,n){var i=this;return t=t||[],n=n||{},e._arrayEach(this.models,function(t){i._removeReference(t)}),this._reset(),this.add(t,{silent:!0,parse:n.parse}),n.silent||this.trigger("reset",this,n),this},fetch:function(t){t=n.clone(t)||{},void 0===t.parse&&(t.parse=!0);var i=this,r=this.query||new e.Query(this.model);return r.find().then(function(e){return t.add?i.add(e,t):i.reset(e,t),i})._thenRunCallbacks(t,this)},create:function(t,e){var i=this;if(e=e?n.clone(e):{},t=this._prepareModel(t,e),!t)return!1;e.wait||i.add(t,e);var r=e.success;return e.success=function(n,s){e.wait&&i.add(n,e),r?r(n,s):n.trigger("sync",t,s,e)},t.save(null,e),t},parse:function(t){return t},chain:function(){return n(this.models).chain()},_reset:function(){this.length=0,this.models=[],this._byId={},this._byCid={}},_prepareModel:function(t,n){if(t instanceof e.Object)t.collection||(t.collection=this);else{var i=t;n.collection=this,t=new this.model(i,n),t._validate(t.attributes,n)||(t=!1)}return t},_removeReference:function(t){this===t.collection&&delete t.collection,t.off("all",this._onModelEvent,this)},_onModelEvent:function(t,e,n,i){("add"!==t&&"remove"!==t||n===this)&&("destroy"===t&&this.remove(e,i),e&&"change:objectId"===t&&(delete this._byId[e.previous("objectId")],this._byId[e.id]=e),this.trigger.apply(this,arguments))}});var i=["forEach","each","map","reduce","reduceRight","find","detect","filter","select","reject","every","all","some","any","include","contains","invoke","max","min","sortBy","sortedIndex","toArray","size","first","initial","rest","last","without","indexOf","shuffle","lastIndexOf","isEmpty","groupBy"];e._arrayEach(i,function(t){e.Collection.prototype[t]=function(){return n[t].apply(n,[this.models].concat(n.toArray(arguments)))}}),e.Collection.extend=e._extend}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.View=function(t){this.cid=n.uniqueId("view"),this._configure(t||{}),this._ensureElement(),this.initialize.apply(this,arguments),this.delegateEvents()};var i=/^(\S+)\s*(.*)$/,r=["model","collection","el","id","attributes","className","tagName"];n.extend(e.View.prototype,e.Events,{tagName:"div",$:function(t){return this.$el.find(t)},initialize:function(){},render:function(){return this},remove:function(){return this.$el.remove(),this},make:function(t,n,i){var r=document.createElement(t);return n&&e.$(r).attr(n),i&&e.$(r).html(i),r},setElement:function(t,n){return this.$el=e.$(t),this.el=this.$el[0],n!==!1&&this.delegateEvents(),this},delegateEvents:function(t){if(t=t||e._getValue(this,"events")){this.undelegateEvents();var r=this;e._objectEach(t,function(e,s){if(n.isFunction(e)||(e=r[t[s]]),!e)throw new Error('Event "'+t[s]+'" does not exist');var a=s.match(i),o=a[1],u=a[2];e=n.bind(e,r),o+=".delegateEvents"+r.cid,""===u?r.$el.bind(o,e):r.$el.delegate(u,o,e)})}},undelegateEvents:function(){this.$el.unbind(".delegateEvents"+this.cid)},_configure:function(t){this.options&&(t=n.extend({},this.options,t));var e=this;n.each(r,function(n){t[n]&&(e[n]=t[n])}),this.options=t},_ensureElement:function(){if(this.el)this.setElement(this.el,!1);else{var t=e._getValue(this,"attributes")||{};this.id&&(t.id=this.id),this.className&&(t["class"]=this.className),this.setElement(this.make(this.tagName,t),!1)}}}),e.View.extend=e._extend}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.User=e.Object.extend("_User",{_isCurrentUser:!1,_mergeMagicFields:function(t){t.sessionToken&&(this._sessionToken=t.sessionToken,delete t.sessionToken),e.User.__super__._mergeMagicFields.call(this,t)},_cleanupAuthData:function(){if(this.isCurrent()){var t=this.get("authData");t&&e._objectEach(this.get("authData"),function(e,n){t[n]||delete t[n]})}},_synchronizeAllAuthData:function(){var t=this.get("authData");if(t){var n=this;e._objectEach(this.get("authData"),function(t,e){n._synchronizeAuthData(e)})}},_synchronizeAuthData:function(t){if(this.isCurrent()){var i;n.isString(t)?(i=t,t=e.User._authProviders[i]):i=t.getAuthType();var r=this.get("authData");if(r&&t){var s=t.restoreAuthentication(r[i]);s||this._unlinkFrom(t)}}},_handleSaveResult:function(t){t&&(this._isCurrentUser=!0),this._cleanupAuthData(),this._synchronizeAllAuthData(),delete this._serverData.password,this._rebuildEstimatedDataForKey("password"),this._refreshCache(),(t||this.isCurrent())&&e.User._saveCurrentUser(this)},_linkWith:function(t,i){var r;if(n.isString(t)?(r=t,t=e.User._authProviders[t]):r=t.getAuthType(),n.has(i,"authData")){var s=this.get("authData")||{};s[r]=i.authData,this.set("authData",s);var a=n.clone(i)||{};return a.success=function(t){t._handleSaveResult(!0),i.success&&i.success.apply(this,arguments)},this.save({authData:s},a)}var o=this,u=new e.Promise;return t.authenticate({success:function(t,e){o._linkWith(t,{authData:e,success:i.success,error:i.error}).then(function(){u.resolve(o)})},error:function(t,e){i.error&&i.error(o,e),u.reject(e)}}),u},_unlinkFrom:function(t,i){var r;n.isString(t)?(r=t,t=e.User._authProviders[t]):r=t.getAuthType();var s=n.clone(i),a=this;return s.authData=null,s.success=function(){a._synchronizeAuthData(t),i.success&&i.success.apply(this,arguments)},this._linkWith(t,s)},_isLinked:function(t){var e;e=n.isString(t)?t:t.getAuthType();var i=this.get("authData")||{};return!!i[e]},_logOutWithAll:function(){var t=this.get("authData");if(t){var n=this;e._objectEach(this.get("authData"),function(t,e){n._logOutWith(e)})}},_logOutWith:function(t){this.isCurrent()&&(n.isString(t)&&(t=e.User._authProviders[t]),t&&t.deauthenticate&&t.deauthenticate())},signUp:function(t,i){var r;i=i||{};var s=t&&t.username||this.get("username");if(!s||""===s)return r=new e.Error(e.Error.OTHER_CAUSE,"Cannot sign up user with an empty name."),i&&i.error&&i.error(this,r),e.Promise.error(r);var a=t&&t.password||this.get("password");if(!a||""===a)return r=new e.Error(e.Error.OTHER_CAUSE,"Cannot sign up user with an empty password."),i&&i.error&&i.error(this,r),e.Promise.error(r);var o=n.clone(i);return o.success=function(t){t._handleSaveResult(!0),i.success&&i.success.apply(this,arguments)},this.save(t,o)},logIn:function(t){var n=this,i=e._request("login",null,null,"GET",this.toJSON());return i.then(function(t,e,i){var r=n.parse(t,e,i);return n._finishFetch(r),n._handleSaveResult(!0),r.smsCode||delete n.attributes.smsCode,n})._thenRunCallbacks(t,this)},save:function(t,i,r){var s,a;n.isObject(t)||n.isNull(t)||n.isUndefined(t)?(s=t,a=i):(s={},s[t]=i,a=r),a=a||{};var o=n.clone(a);return o.success=function(t){t._handleSaveResult(!1),a.success&&a.success.apply(this,arguments)},e.Object.prototype.save.call(this,s,o)},follow:function(t,i){if(!this.id)throw"Please signin.";if(!t)throw"Invalid target user.";var r=n.isString(t)?t:t.id;if(!r)throw"Invalid target user.";var s="users/"+this.id+"/friendship/"+r,a=e._request(s,null,null,"POST",null);return a._thenRunCallbacks(i)},unfollow:function(t,i){if(!this.id)throw"Please signin.";if(!t)throw"Invalid target user.";var r=n.isString(t)?t:t.id;if(!r)throw"Invalid target user.";var s="users/"+this.id+"/friendship/"+r,a=e._request(s,null,null,"DELETE",null);return a._thenRunCallbacks(i)},followerQuery:function(){return e.User.followerQuery(this.id)},followeeQuery:function(){return e.User.followeeQuery(this.id)},fetch:function(t){var i=t?n.clone(t):{};return i.success=function(e){e._handleSaveResult(!1),t&&t.success&&t.success.apply(this,arguments)},e.Object.prototype.fetch.call(this,i)},isCurrent:function(){return this._isCurrentUser},getUsername:function(){return this.get("username")},getMobilePhoneNumber:function(){return this.get("mobilePhoneNumber")},setMobilePhoneNumber:function(t,e){return this.set("mobilePhoneNumber",t,e)},setUsername:function(t,e){return this.set("username",t,e)},setPassword:function(t,e){return this.set("password",t,e)},getEmail:function(){return this.get("email")},setEmail:function(t,e){return this.set("email",t,e)},authenticated:function(){return!!this._sessionToken&&e.User.current()&&e.User.current().id===this.id}},{_currentUser:null,_currentUserMatchesDisk:!1,_CURRENT_USER_KEY:"currentUser",_authProviders:{},signUp:function(t,n,i,r){i=i||{},i.username=t,i.password=n;var s=e.Object._create("_User");return s.signUp(i,r)},logIn:function(t,n,i){var r=e.Object._create("_User");return r._finishFetch({username:t,password:n}),r.logIn(i)},logInWithMobilePhoneSmsCode:function(t,n,i){var r=e.Object._create("_User");return r._finishFetch({mobilePhoneNumber:t,smsCode:n}),r.logIn(i)},logInWithMobilePhone:function(t,n,i){var r=e.Object._create("_User");return r._finishFetch({mobilePhoneNumber:t,password:n}),r.logIn(i)},logOut:function(){null!==e.User._currentUser&&(e.User._currentUser._logOutWithAll(),e.User._currentUser._isCurrentUser=!1),e.User._currentUserMatchesDisk=!0,e.User._currentUser=null,e.localStorage.removeItem(e._getAVPath(e.User._CURRENT_USER_KEY))},followerQuery:function(t){if(!t||!n.isString(t))throw"Invalid user object id.";var i=new e.FriendShipQuery("_Follower");return i._friendshipTag="follower",i.equalTo("user",e.Object.createWithoutData("_User",t)),i},followeeQuery:function(t){if(!t||!n.isString(t))throw"Invalid user object id.";var i=new e.FriendShipQuery("_Followee");return i._friendshipTag="followee",i.equalTo("user",e.Object.createWithoutData("_User",t)),i},requestPasswordReset:function(t,n){var i={email:t},r=e._request("requestPasswordReset",null,null,"POST",i);return r._thenRunCallbacks(n)},requestEmailVerify:function(t,n){var i={email:t},r=e._request("requestEmailVerify",null,null,"POST",i);return r._thenRunCallbacks(n)},requestEmailVerfiy:function(t,n){var i={email:t},r=e._request("requestEmailVerify",null,null,"POST",i);return r._thenRunCallbacks(n)},requestMobilePhoneVerify:function(t,n){var i={mobilePhoneNumber:t},r=e._request("requestMobilePhoneVerify",null,null,"POST",i);return r._thenRunCallbacks(n)},requestPasswordResetBySmsCode:function(t,n){var i={mobilePhoneNumber:t},r=e._request("requestPasswordResetBySmsCode",null,null,"POST",i);return r._thenRunCallbacks(n)},resetPasswordBySmsCode:function(t,n,i){var r={password:n},s=e._request("resetPasswordBySmsCode",null,t,"PUT",r);return s._thenRunCallbacks(i)},verifyMobilePhone:function(t,n){var i=e._request("verifyMobilePhone",null,t,"POST",null);return i._thenRunCallbacks(n)},requestLoginSmsCode:function(t,n){var i={mobilePhoneNumber:t},r=e._request("requestLoginSmsCode",null,null,"POST",i);return r._thenRunCallbacks(n)},current:function(){if(e.User._currentUser)return e.User._currentUser;if(e.User._currentUserMatchesDisk)return e.User._currentUser;e.User._currentUserMatchesDisk=!0;var t=e.localStorage.getItem(e._getAVPath(e.User._CURRENT_USER_KEY));if(!t)return null;e.User._currentUser=e.Object._create("_User"),e.User._currentUser._isCurrentUser=!0;var n=JSON.parse(t);return e.User._currentUser.id=n._id,delete n._id,e.User._currentUser._sessionToken=n._sessionToken,delete n._sessionToken,e.User._currentUser.set(n),e.User._currentUser._synchronizeAllAuthData(),e.User._currentUser._refreshCache(),e.User._currentUser._opSetQueue=[{}],e.User._currentUser},_saveCurrentUser:function(t){e.User._currentUser!==t&&e.User.logOut(),t._isCurrentUser=!0,e.User._currentUser=t,e.User._currentUserMatchesDisk=!0;var n=t.toJSON();n._id=t.id,n._sessionToken=t._sessionToken,e.localStorage.setItem(e._getAVPath(e.User._CURRENT_USER_KEY),JSON.stringify(n))},_registerAuthenticationProvider:function(t){e.User._authProviders[t.getAuthType()]=t,e.User.current()&&e.User.current()._synchronizeAuthData(t.getAuthType())},_logInWith:function(t,n){var i=e.Object._create("_User");return i._linkWith(t,n)}})}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Query=function(t){n.isString(t)&&(t=e.Object._getSubclass(t)),this.objectClass=t,this.className=t.prototype.className,this._where={},this._include=[],this._limit=-1,this._skip=0,this._extraOptions={}},e.Query.or=function(){var t=n.toArray(arguments),i=null;e._arrayEach(t,function(t){if(n.isNull(i)&&(i=t.className),i!==t.className)throw"All queries must be for the same class"});var r=new e.Query(i);return r._orQuery(t),r},e.Query.and=function(){var t=n.toArray(arguments),i=null;e._arrayEach(t,function(t){if(n.isNull(i)&&(i=t.className),i!==t.className)throw"All queries must be for the same class"});var r=new e.Query(i);return r._andQuery(t),r},e.Query.doCloudQuery=function(t,i,r){var s={cql:t};n.isArray(i)?s.pvalues=i:r=i;var a=e._request("cloudQuery",null,null,"GET",s);return a.then(function(t){var i=new e.Query(t.className),r=n.map(t.results,function(e){var n=i._newObject(t);return n._finishFetch(i._processResult(e),!0),n});return{results:r,count:t.count,className:t.className}})._thenRunCallbacks(r)},e.Query._extend=e._extend,e.Query.prototype={_processResult:function(t){return t},get:function(t,n){var i=this;return i.equalTo("objectId",t),i.first().then(function(t){if(t)return t;var n=new e.Error(e.Error.OBJECT_NOT_FOUND,"Object not found.");return e.Promise.error(n)})._thenRunCallbacks(n,null)},toJSON:function(){var t={where:this._where};return this._include.length>0&&(t.include=this._include.join(",")),this._select&&(t.keys=this._select.join(",")),this._limit>=0&&(t.limit=this._limit),this._skip>0&&(t.skip=this._skip),void 0!==this._order&&(t.order=this._order),e._objectEach(this._extraOptions,function(e,n){t[n]=e}),t},_newObject:function(t){return obj=t&&t.className?new e.Object(t.className):new this.objectClass},_createRequest:function(t){return e._request("classes",this.className,null,"GET",t||this.toJSON())},find:function(t){var e=this,i=this._createRequest();return i.then(function(t){return n.map(t.results,function(n){var i=e._newObject(t);return i._finishFetch(e._processResult(n),!0),i})})._thenRunCallbacks(t)},destroyAll:function(t){var n=this;return n.find().then(function(t){return e.Object.destroyAll(t)})._thenRunCallbacks(t)},count:function(t){var e=this.toJSON();e.limit=0,e.count=1;var n=this._createRequest(e);return n.then(function(t){return t.count})._thenRunCallbacks(t)},first:function(t){var e=this,i=this.toJSON();i.limit=1;var r=this._createRequest(i);return r.then(function(t){return n.map(t.results,function(t){var n=e._newObject();return n._finishFetch(e._processResult(t),!0),n})[0]})._thenRunCallbacks(t)},collection:function(t,i){return i=i||{},new e.Collection(t,n.extend(i,{model:this._objectClass||this.objectClass,query:this}))},skip:function(t){return this._skip=t,this},limit:function(t){return this._limit=t,this},equalTo:function(t,n){return this._where[t]=e._encode(n),this},_addCondition:function(t,n,i){return this._where[t]||(this._where[t]={}),this._where[t][n]=e._encode(i),this},notEqualTo:function(t,e){return this._addCondition(t,"$ne",e),this},lessThan:function(t,e){return this._addCondition(t,"$lt",e),this},greaterThan:function(t,e){return this._addCondition(t,"$gt",e),this},lessThanOrEqualTo:function(t,e){return this._addCondition(t,"$lte",e),this},greaterThanOrEqualTo:function(t,e){return this._addCondition(t,"$gte",e),this},containedIn:function(t,e){return this._addCondition(t,"$in",e),this},notContainedIn:function(t,e){return this._addCondition(t,"$nin",e),this},containsAll:function(t,e){return this._addCondition(t,"$all",e),this},exists:function(t){return this._addCondition(t,"$exists",!0),this},doesNotExist:function(t){return this._addCondition(t,"$exists",!1),this},matches:function(t,e,n){return this._addCondition(t,"$regex",e),n||(n=""),e.ignoreCase&&(n+="i"),e.multiline&&(n+="m"),n&&n.length&&this._addCondition(t,"$options",n),this},matchesQuery:function(t,e){var n=e.toJSON();return n.className=e.className,this._addCondition(t,"$inQuery",n),this},doesNotMatchQuery:function(t,e){var n=e.toJSON();return n.className=e.className,this._addCondition(t,"$notInQuery",n),this},matchesKeyInQuery:function(t,e,n){var i=n.toJSON();return i.className=n.className,this._addCondition(t,"$select",{key:e,query:i}),this},doesNotMatchKeyInQuery:function(t,e,n){var i=n.toJSON();return i.className=n.className,this._addCondition(t,"$dontSelect",{key:e,query:i}),this},_orQuery:function(t){var e=n.map(t,function(t){return t.toJSON().where});return this._where.$or=e,this},_andQuery:function(t){var e=n.map(t,function(t){return t.toJSON().where});return this._where.$and=e,this},_quote:function(t){return"\\Q"+t.replace("\\E","\\E\\\\E\\Q")+"\\E"},contains:function(t,e){return this._addCondition(t,"$regex",this._quote(e)),this},startsWith:function(t,e){return this._addCondition(t,"$regex","^"+this._quote(e)),this},endsWith:function(t,e){return this._addCondition(t,"$regex",this._quote(e)+"$"),this},ascending:function(t){return this._order=t,this},addAscending:function(t){return this._order?this._order+=","+t:this._order=t,this},descending:function(t){return this._order="-"+t,this},addDescending:function(t){return this._order?this._order+=",-"+t:this._order=t,t},near:function(t,n){return n instanceof e.GeoPoint||(n=new e.GeoPoint(n)),this._addCondition(t,"$nearSphere",n),this},withinRadians:function(t,e,n){return this.near(t,e),this._addCondition(t,"$maxDistance",n),this},withinMiles:function(t,e,n){return this.withinRadians(t,e,n/3958.8)},withinKilometers:function(t,e,n){return this.withinRadians(t,e,n/6371)},withinGeoBox:function(t,n,i){return n instanceof e.GeoPoint||(n=new e.GeoPoint(n)),i instanceof e.GeoPoint||(i=new e.GeoPoint(i)),this._addCondition(t,"$within",{$box:[n,i]}),this},include:function(){var t=this;return e._arrayEach(arguments,function(e){n.isArray(e)?t._include=t._include.concat(e):t._include.push(e)}),this},select:function(){var t=this;return this._select=this._select||[],e._arrayEach(arguments,function(e){n.isArray(e)?t._select=t._select.concat(e):t._select.push(e)}),this},each:function(t,i){if(i=i||{},this._order||this._skip||this._limit>=0){var r="Cannot iterate on a query with sort, skip, or limit.";return e.Promise.error(r)._thenRunCallbacks(i)}var s=(new e.Promise,new e.Query(this.objectClass));s._limit=i.batchSize||100,s._where=n.clone(this._where),s._include=n.clone(this._include),s.ascending("objectId");var a=!1;return e.Promise._continueWhile(function(){return!a},function(){return s.find().then(function(n){var i=e.Promise.as();return e._.each(n,function(e){i=i.then(function(){return t(e)})}),i.then(function(){n.length>=s._limit?s.greaterThan("objectId",n[n.length-1].id):a=!0})})})._thenRunCallbacks(i)}},e.FriendShipQuery=e.Query._extend({_objectClass:e.User,_newObject:function(){return new e.User},_processResult:function(t){var e=t[this._friendshipTag];return"Pointer"===e.__type&&"_User"===e.className&&(delete e.__type,delete e.className),e}})}(this),function(t){t.AV=t.AV||{};var e,n,i=t.AV,r=i._,s=!1,a={authenticate:function(t){var n=this;FB.login(function(e){e.authResponse?t.success&&t.success(n,{id:e.authResponse.userID,access_token:e.authResponse.accessToken,expiration_date:new Date(1e3*e.authResponse.expiresIn+(new Date).getTime()).toJSON()}):t.error&&t.error(n,e)},{scope:e})},restoreAuthentication:function(t){if(t){var e={userID:t.id,accessToken:t.access_token,expiresIn:(i._parseDate(t.expiration_date).getTime()-(new Date).getTime())/1e3},s=r.clone(n);s.authResponse=e,s.status=!1,FB.init(s)}return!0},getAuthType:function(){return"facebook"},deauthenticate:function(){this.restoreAuthentication(null),FB.logout()}};i.FacebookUtils={init:function(t){if("undefined"==typeof FB)throw"The Facebook JavaScript SDK must be loaded before calling init.";if(n=r.clone(t)||{},n.status&&"undefined"!=typeof console){var e=console.warn||console.log||function(){};e.call(console,"The 'status' flag passed into FB.init, when set to true, can interfere with AV Facebook integration, so it has been suppressed. Please call FB.getLoginStatus() explicitly if you require this behavior.")}n.status=!1,FB.init(n),i.User._registerAuthenticationProvider(a),s=!0},isLinked:function(t){return t._isLinked("facebook")},logIn:function(t,n){if(!t||r.isString(t)){if(!s)throw"You must initialize FacebookUtils before calling logIn.";return e=t,i.User._logInWith("facebook",n)}var a=r.clone(n)||{};return a.authData=t,i.User._logInWith("facebook",a)},link:function(t,n,i){if(!n||r.isString(n)){if(!s)throw"You must initialize FacebookUtils before calling link.";return e=n,t._linkWith("facebook",i)}var a=r.clone(i)||{};return a.authData=n,t._linkWith("facebook",a)},unlink:function(t,e){if(!s)throw"You must initialize FacebookUtils before calling unlink.";return t._unlinkFrom("facebook",e)}}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.History=function(){this.handlers=[],n.bindAll(this,"checkUrl")};var i=/^[#\/]/,r=/msie [\w.]+/;e.History.started=!1,n.extend(e.History.prototype,e.Events,{interval:50,getHash:function(t){var e=t?t.location:window.location,n=e.href.match(/#(.*)$/);return n?n[1]:""},getFragment:function(t,n){if(e._isNullOrUndefined(t))if(this._hasPushState||n){t=window.location.pathname;var r=window.location.search;r&&(t+=r)}else t=this.getHash();return t.indexOf(this.options.root)||(t=t.substr(this.options.root.length)),t.replace(i,"")},start:function(t){if(e.History.started)throw new Error("AV.history has already been started");e.History.started=!0,this.options=n.extend({},{root:"/"},this.options,t),this._wantsHashChange=this.options.hashChange!==!1,this._wantsPushState=!!this.options.pushState,this._hasPushState=!!(this.options.pushState&&window.history&&window.history.pushState);var s=this.getFragment(),a=document.documentMode,o=r.exec(navigator.userAgent.toLowerCase())&&(!a||7>=a);o&&(this.iframe=e.$('<iframe src="javascript:0" tabindex="-1" />').hide().appendTo("body")[0].contentWindow,this.navigate(s)),this._hasPushState?e.$(window).bind("popstate",this.checkUrl):this._wantsHashChange&&"onhashchange"in window&&!o?e.$(window).bind("hashchange",this.checkUrl):this._wantsHashChange&&(this._checkUrlInterval=window.setInterval(this.checkUrl,this.interval)),this.fragment=s;var u=window.location,c=u.pathname===this.options.root;return this._wantsHashChange&&this._wantsPushState&&!this._hasPushState&&!c?(this.fragment=this.getFragment(null,!0),window.location.replace(this.options.root+"#"+this.fragment),!0):(this._wantsPushState&&this._hasPushState&&c&&u.hash&&(this.fragment=this.getHash().replace(i,""),window.history.replaceState({},document.title,u.protocol+"//"+u.host+this.options.root+this.fragment)),this.options.silent?void 0:this.loadUrl())},stop:function(){e.$(window).unbind("popstate",this.checkUrl).unbind("hashchange",this.checkUrl),window.clearInterval(this._checkUrlInterval),e.History.started=!1},route:function(t,e){this.handlers.unshift({route:t,callback:e})},checkUrl:function(){var t=this.getFragment();return t===this.fragment&&this.iframe&&(t=this.getFragment(this.getHash(this.iframe))),t===this.fragment?!1:(this.iframe&&this.navigate(t),void(this.loadUrl()||this.loadUrl(this.getHash())))},loadUrl:function(t){var e=this.fragment=this.getFragment(t),i=n.any(this.handlers,function(t){return t.route.test(e)?(t.callback(e),!0):void 0});return i},navigate:function(t,n){if(!e.History.started)return!1;n&&n!==!0||(n={trigger:n});var r=(t||"").replace(i,"");if(this.fragment!==r){if(this._hasPushState){0!==r.indexOf(this.options.root)&&(r=this.options.root+r),this.fragment=r;var s=n.replace?"replaceState":"pushState";window.history[s]({},document.title,r)}else this._wantsHashChange?(this.fragment=r,this._updateHash(window.location,r,n.replace),this.iframe&&r!==this.getFragment(this.getHash(this.iframe))&&(n.replace||this.iframe.document.open().close(),this._updateHash(this.iframe.location,r,n.replace))):window.location.assign(this.options.root+t);n.trigger&&this.loadUrl(t)}},_updateHash:function(t,e,n){if(n){var i=t.toString().replace(/(javascript:|#).*$/,"");t.replace(i+"#"+e)}else t.hash=e}})}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Router=function(t){t=t||{},t.routes&&(this.routes=t.routes),this._bindRoutes(),this.initialize.apply(this,arguments)};var i=/:\w+/g,r=/\*\w+/g,s=/[\-\[\]{}()+?.,\\\^\$\|#\s]/g;n.extend(e.Router.prototype,e.Events,{initialize:function(){},route:function(t,i,r){return e.history=e.history||new e.History,n.isRegExp(t)||(t=this._routeToRegExp(t)),r||(r=this[i]),e.history.route(t,n.bind(function(n){var s=this._extractParameters(t,n);r&&r.apply(this,s),this.trigger.apply(this,["route:"+i].concat(s)),e.history.trigger("route",this,i,s)},this)),this},navigate:function(t,n){e.history.navigate(t,n)},_bindRoutes:function(){if(this.routes){var t=[];for(var e in this.routes)this.routes.hasOwnProperty(e)&&t.unshift([e,this.routes[e]]);for(var n=0,i=t.length;i>n;n++)this.route(t[n][0],t[n][1],this[t[n][1]])}},_routeToRegExp:function(t){return t=t.replace(s,"\\$&").replace(i,"([^/]+)").replace(r,"(.*?)"),new RegExp("^"+t+"$")},_extractParameters:function(t,e){return t.exec(e).slice(1)}}),e.Router.extend=e._extend}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Cloud=e.Cloud||{},n.extend(e.Cloud,{run:function(t,n,i){var r=e._request("functions",t,null,"POST",e._encode(n,null,!0));return r.then(function(t){return e._decode(null,t).result})._thenRunCallbacks(i)},requestSmsCode:function(t,i){if(n.isString(t)&&(t={mobilePhoneNumber:t}),!t.mobilePhoneNumber)throw"Missing mobilePhoneNumber.";var r=e._request("requestSmsCode",null,null,"POST",t);return r._thenRunCallbacks(i)},verifySmsCode:function(t,n,i){if(!t)throw"Missing sms code.";var r={};e._.isString(n)?r.mobilePhoneNumber=n:i=n;var s=e._request("verifySmsCode",t,null,"POST",r);return s._thenRunCallbacks(i)}})}(this),function(t){t.AV=t.AV||{};var e=t.AV;e.Installation=e.Object.extend("_Installation"),e.Push=e.Push||{},e.Push.send=function(t,n){if(t.where&&(t.where=t.where.toJSON().where),t.where&&t.cql)throw"Both where and cql can't be set";if(t.push_time&&(t.push_time=t.push_time.toJSON()),t.expiration_time&&(t.expiration_time=t.expiration_time.toJSON()),t.expiration_time&&t.expiration_time_interval)throw"Both expiration_time and expiration_time_interval can't be set";var i=e._request("push",null,null,"POST",t);return i._thenRunCallbacks(n)}}(this),function(t){t.AV=t.AV||{};var e=t.AV,n=e._;e.Status=function(t,e){return this.data={},this.inboxType="default",this.query=null,t&&"object"==typeof t?this.data=t:(t&&(this.data.image=t),e&&(this.data.message=e)),this},e.Status.prototype={get:function(t){return this.data[t]},set:function(t,e){return this.data[t]=e,this},destroy:function(t){if(!this.id)return e.Promise.error("The status id is not exists.")._thenRunCallbacks(t);var n=e._request("statuses",null,this.id,"DELETE");return n._thenRunCallbacks(t)},toObject:function(){return this.id?e.Object.createWithoutData("_Status",this.id):null},send:function(t){if(!e.User.current())throw"Please signin an user.";if(!this.query)return e.Status.sendStatusToFollowers(this,t);var n=this.query.toJSON();n.className=this.query.className;var i={};i.query=n,this.data=this.data||{};var r=e.Object.createWithoutData("_User",e.User.current().id)._toPointer();this.data.source=this.data.source||r,i.data=this.data,i.inboxType=this.inboxType||"default";var s=e._request("statuses",null,null,"POST",i),a=this;return s.then(function(t){return a.id=t.objectId,a.createdAt=e._parseDate(t.createdAt),a})._thenRunCallbacks(t)},_finishFetch:function(t){this.id=t.objectId,this.createdAt=e._parseDate(t.createdAt),this.updatedAt=e._parseDate(t.updatedAt),this.messageId=t.messageId,delete t.messageId,delete t.objectId,delete t.createdAt,delete t.updatedAt,this.data=t}},e.Status.sendStatusToFollowers=function(t,n){if(!e.User.current())throw"Please signin an user.";var i={};i.className="_Follower",i.keys="follower";var r=e.Object.createWithoutData("_User",e.User.current().id)._toPointer();i.where={user:r};var s={};s.query=i,t.data=t.data||{},t.data.source=t.data.source||r,s.data=t.data,s.inboxType=t.inboxType||"default";var a=e._request("statuses",null,null,"POST",s);return a.then(function(n){return t.id=n.objectId,t.createdAt=e._parseDate(n.createdAt),t})._thenRunCallbacks(n)},e.Status.sendPrivateStatus=function(t,i,r){if(!e.User.current())throw"Please signin an user.";if(!i)throw"Invalid target user.";var s=n.isString(i)?i:i.id;if(!s)throw"Invalid target user.";var a={};a.className="_User";var o=e.Object.createWithoutData("_User",e.User.current().id)._toPointer();a.where={objectId:s};var u={};u.query=a,t.data=t.data||{},t.data.source=t.data.source||o,u.data=t.data,u.inboxType="private",t.inboxType="private";var c=e._request("statuses",null,null,"POST",u);return c.then(function(n){return t.id=n.objectId,t.createdAt=e._parseDate(n.createdAt),t})._thenRunCallbacks(r)},e.Status.countUnreadStatuses=function(t){if(!e.User.current()&&null==t)throw"Please signin an user or pass the owner objectId.";t=t||e.User.current();var i=n.isString(arguments[1])?arguments[2]:arguments[1],r=n.isString(arguments[1])?arguments[1]:"default",s={};s.inboxType=e._encode(r),s.owner=e._encode(t);var a=e._request("subscribe/statuses/count",null,null,"GET",s);return a._thenRunCallbacks(i)},e.Status.statusQuery=function(t){var n=new e.Query("_Status");return t&&n.equalTo("source",t),n},e.InboxQuery=e.Query._extend({_objectClass:e.Status,_sinceId:0,_maxId:0,_inboxType:"default",_owner:null,_newObject:function(){return new e.Status},_createRequest:function(t){return e._request("subscribe/statuses",null,null,"GET",t||this.toJSON())},sinceId:function(t){return this._sinceId=t,this},maxId:function(t){return this._maxId=t,this},owner:function(t){return this._owner=t,this},inboxType:function(t){return this._inboxType=t,this},toJSON:function(){var t=e.InboxQuery.__super__.toJSON.call(this);return t.owner=e._encode(this._owner),t.inboxType=e._encode(this._inboxType),t.sinceId=e._encode(this._sinceId),t.maxId=e._encode(this._maxId),t}}),e.Status.inboxQuery=function(t,n){var i=new e.InboxQuery(e.Status);return t&&(i._owner=t),n&&(i._inboxType=n),i}}(this);
$(function() {
    AV.initialize("5nm1ly7bnbqrc4lzkfbrm33kb6hrrfbd5ojopd8sq0imq3j6", "j65povz7i4o3h4r27pu76yo0utdlw7pz184jl97d6nakjw16")
    window.bigcache = {}
    var syncData
    var cacheExpired
    $(document).on("emailAddr", function(e, email) {
        var SubscribedEmail = AV.Object.extend("SubscribedEmail")
        var queryEmail = new AV.Query(SubscribedEmail)
        queryEmail.equalTo("email", email)
        queryEmail.find({
            success: function(results) {
                if (!results.length) {
                    var subscribedEmail = new SubscribedEmail()
                    subscribedEmail.set("email", email)
                    subscribedEmail.save(null)
                }
            },
            error: function(results) {
                var subscribedEmail = new SubscribedEmail()
                subscribedEmail.set("email", email)
                subscribedEmail.save(null)
            }
        })
    })
    var Feedback = AV.Object.extend("Feedback")
    $(document).on("feedback", function(e, email, content) {
        if (content) {
            var feedback = new Feedback()
            feedback.set("email", email)
            feedback.set("content", content)
            feedback.save(null)
        }
    })
    var Token = AV.Object.extend("Token")
    $(document).on("token", function(e, data) {
        if (data) {
            var query = new AV.Query(Token)
            query.equalTo("token", data)
            query.find({
                success: function(results) {
                    if (!results.length) {
                        var token = new Token()
                        token.set("token", data)
                        token.save(null)
                    }
                }
            })
        }
    })
    var getRamdomToken = function() {
        var query = new AV.Query(Token)
        query.find({
            success: function(results) {
                if (results.length) {
                    $.ajaxSetup({
                        headers: {
                            "Authorization": "token " + results[Math.floor((Math.random() * results.length))].get("token")
                        }
                    })
                }
            }
        })
    }
    var nowId
    getRamdomToken()
    $(document).on("github_id", function(e, n) {
        if (n) {
            nowId = n
            var refreshInterval
            var updatedSeconds
            var nowSeconds = new Date().getTime() / 1000
            var InformationObject = AV.Object.extend("InformationObject")
            var query = new AV.Query(InformationObject)
            var SearchCount = AV.Object.extend("SearchCount")
            var queryCount = new AV.Query(SearchCount)
            query.equalTo("userInfo", n)
            query.find({
                success: function(results) {
                    if (results.length) {
                        syncData = function() {
                            window.bigcache.cache.save()
                        }
                        window.bigcache.cache = results[0]
                        updatedSeconds = window.bigcache.cache.updatedAt.getTime() / 1000
                        refreshInterval = 24 * 3600
                        cacheExpired = nowSeconds - updatedSeconds >= refreshInterval
                    } else {
                        syncData = function() {
                            window.bigcache.cache.save(null)
                        }
                        window.bigcache.cache = new InformationObject()
                        window.bigcache.cache.set("userInfo", n)
                        updatedSeconds = new Date().getTime() / 1000
                        refreshInterval = 24 * 3600
                        cacheExpired = nowSeconds - updatedSeconds >= refreshInterval
                    }
                },
                error: function(error) {
                    syncData = function() {
                        window.bigcache.cache.save(null)
                    }
                    window.bigcache.cache = new InformationObject()
                    window.bigcache.cache.set("userInfo", n)
                    updatedSeconds = new Date().getTime() / 1000
                    refreshInterval = 24 * 3600
                    cacheExpired = nowSeconds - updatedSeconds >= refreshInterval

                }
            })
            if (!window.forShare) {
                queryCount.equalTo("username", n)
                queryCount.find({
                    success: function(results) {
                        if (results.length) {
                            results[0].increment("search_count")
                            results[0].save()
                        } else {
                            searchCount = new SearchCount()
                            searchCount.set("username", n)
                            searchCount.set("search_count", 1)
                            searchCount.save(null)
                        }
                    },
                    error: function(error) {
                        searchCount = new SearchCount()
                        searchCount.set("username", n)
                        searchCount.set("search_count", 1)
                        searchCount.save(null)
                    }
                })
            }
        }
    })
    var oldAjax = $.ajax
    var timeoutId = -1
    var ajaxMap = {
        userInfos: /^https:\/\/api\.github\.com\/users\/\w*$/,
        // userRepoInfo: /^https:\/\/api\.github\.com\/users\/\S*\/repos\?page=1&per_page=10000$/,
        repoLanguage: /^https:\/\/api\.github\.com\/repos\/\w*\/(\S*)\/languages$/m,
        starredRepo: /^https:\/\/api\.github\.com\/users\/\S*\/starred\?page=(\d+)&per_page=100$/m
    }
    $.ajax = function(o) {
        var doAjax = function() {
            if (window.bigcache.cache || o.url.indexOf("api.github.com/search/users") != -1) {
                var needAjax = true
                $.each(ajaxMap, function(name, re) {
                    if (o.url.match(re)) {
                        needAjax = false
                        if (re.exec(o.url).length > 1) {
                            var index = utf8_to_b64(re.exec(o.url)[1])
                            if (Object.prototype.toString.call(window.bigcache.cache.get(name)) !== "[object Object]") {
                                window.bigcache.cache.set(name, {})
                            }
                            if (!$.isEmptyObject(window.bigcache.cache.get(name)[index]) && nowId == window.bigcache.cache.get("userInfo") && !cacheExpired) {
                                o.success(window.bigcache.cache.get(name)[index])
                            } else {
                                $(document).one(utf8_to_b64(o.url), function(e, data) {
                                    console.log(index)
                                    data = JSON.parse(data)
                                    var temp = window.bigcache.cache.get(name)
                                    temp[index] = data
                                    window.bigcache.cache.set(name, temp)
                                    if (timeoutId != -1) {
                                        clearTimeout(timeoutId)
                                    }
                                    timeoutId = setTimeout(syncData, 2000)
                                })
                                oldAjax(o)
                            }
                        } else {
                            if (!$.isEmptyObject(window.bigcache.cache.get(name)) && nowId == window.bigcache.cache.get("userInfo") && !cacheExpired) {
                                o.success(window.bigcache.cache.get(name))
                            } else {
                                $(document).one(utf8_to_b64(o.url), function(e, data) {
                                    data = JSON.parse(data)
                                    window.bigcache.cache.set(name, data)
                                    if (timeoutId != -1) {
                                        clearTimeout(timeoutId)
                                    }
                                    timeoutId = setTimeout(syncData, 2000)
                                })
                                oldAjax(o)
                            }
                        }
                    }
                })
                if (needAjax) {
                    oldAjax(o)
                }
            } else {
                setTimeout(doAjax, 200)
            }
        }
        setTimeout(doAjax, 200)
    }
}())
