var toml = require("toml");
var S = require("string");

var CONTENT_PATH_PREFIX = "content/post";

module.exports = function(grunt) {

    grunt.registerTask("lunr-index", function() {

        grunt.log.writeln("Build pages index");
        
        var indexPages = function() {
            var pagesIndex = [];
            grunt.file.recurse(CONTENT_PATH_PREFIX, function(abspath, rootdir, subdir, filename) {
                grunt.log.writeln("Parse file:", abspath);
                if (filename == "index.md") {
                    pagesIndex.push(processFile(abspath, filename));
                }
            });
            return pagesIndex;
        };

        var processFile = function(abspath, filename) {
            var pageIndex;

          if (S(filename).endsWith(".html")) {
                pageIndex = processHTMLFile(abspath, filename);
        } else if (S(filename).contains("index.md")) {
                grunt.log.writeln("Process File", filename)
                pageIndex = processMDFile(abspath, filename);
          }
            grunt.log.writeln("Return: ", pageIndex)
            return (pageIndex == undefined ? 'SKIP' : pageIndex);
        };

        var processHTMLFile = function(abspath, filename) {
            var content = grunt.file.read(abspath);
            var pageName = S(filename).chompRight(".html").s;
            var href = S(abspath)
                .chompLeft(CONTENT_PATH_PREFIX).s;
            return {
                title: pageName,
                href: href,
                content: S(content).trim().stripTags().stripPunctuation().s
            };
        };

        var processMDFile = function (abspath, filename) {
            if (S(filename) == "index.md") {   
                var content = grunt.file.read(abspath);
                    var pageIndex;
                    // First separate the Front Matter from the content and parse it
                    content = content.split("+++");
                    var frontMatter;
                try {
                        grunt.log.writeln("Got the Front Matter")
                        frontMatter = toml.parse(content[1].trim());
                    } catch (e) {
                        grunt.log.error(e.message);
                    }

                    var href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(".md").s;
                    // href for index.md files stops at the folder name
                    if (S(filename) == "index.md") {
                        href = S(abspath).chompLeft(CONTENT_PATH_PREFIX).chompRight(filename).s;
                        // Build Lunr index for this page
                        pageIndex = {
                            title: frontMatter.title,
                            tags: frontMatter.tags,
                            href: href,
                            content: S(content[2]).trim().stripTags().stripPunctuation().s
                        }
                };
                return pageIndex;
            } else {
                grunt.log.writeln("Not Required", filename)
                return
            }
        };
        grunt.file.write("static/lunr/Index.json", JSON.stringify(indexPages()));
        grunt.log.ok("Index built");
    });
};