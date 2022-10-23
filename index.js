"use strict";
exports.__esModule = true;
var core = require("@actions/core");
var github = require("@actions/github");
var token = core.getInput('token');
var labels = JSON.parse(core.getInput('labels'));
var skipSec = parseInt(core.getInput('skip_hour')) * 60 * 60;
var repoOwner = github.context.repo.owner;
var repo = github.context.repo.repo;
function pullRequests(repoOwner, repo) {
    var pr = new github.GitHub(token);
    var resp = pr.pulls.list({
        owner: repoOwner,
        repo: repo
    })["catch"](function (e) {
        console.log(e.message);
    });
    return resp;
}
function filterLabel(labels, target) {
    var labelname = labels.map(function (label) {
        return label.name;
    });
    var filterdLabels = labelname.filter(function (label) { return target.indexOf(label) != -1; });
    if (filterdLabels.length == target.length) {
        return true;
    }
    else {
        return false;
    }
}
function filterTime(pull, target) {
    var createdAt = Date.parse(pull.created_at);
    var gapSec = Math.round((target - createdAt) / 1000);
    if (gapSec > skipSec) {
        return true;
    }
    return false;
}
function setOutput(pull) {
    var output = '';
    for (var _i = 0, pull_1 = pull; _i < pull_1.length; _i++) {
        var p = pull_1[_i];
        //output = output + p.title + "\\n" + p.html_url + "\\n---\\n";
        //changing the return results
        output = output + p.title + "\\n---\\n";
    }
    output = output.slice(0, -7); //最後の"\\n---\\n"を削除
    core.setOutput('pulls', output);
}
var now = Date.now();
var prom = pullRequests(repoOwner, repo);
prom.then(function (pulls) {
    var claim = pulls.data.filter(function (p) { return filterLabel(p.labels, labels) && filterTime(p, now); });
    setOutput(claim);
});
