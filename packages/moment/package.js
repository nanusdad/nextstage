Package.describe({
  summary: "moment"
});

Npm.depends({"moment": "2.1.0"});

Package.on_use(function (api) {
  api.add_files("moment.js", ["server"]);
});
