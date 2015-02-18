var gulp = require('gulp');
var $ = require('gulp-load-plugins')();
var del = require('del');
var runSequence = require('run-sequence');
var browserSync = require('browser-sync');
var reload = browserSync.reload;
var handlebarsData = require('./_data');

var appConfig = {
  src: 'app/',
  dest: 'dist/'
}

// Start browserSync server
gulp.task('browserSync', function() {
  browserSync({
    server: {
      baseDir: appConfig.src
        // proxy: "yourlocal.dev"
    }
  })
})

// Cleans up all dev output directories
gulp.task('clean:dev', function() {
  del([appConfig.src + '*.html']);
  del([appConfig.src + 'css']);
});

// Cleans output directory
gulp.task('clean:dist', function() {
  del([appConfig.dest]);
});

// Gulp Sass Task 
gulp.task('styles', function() {
  // Compile Sass to CSS with LibSass, autoprefixes and creates sourcemaps
  return gulp.src(appConfig.src + 'scss/{,*/}*.{scss,sass}')
    .pipe($.sourcemaps.init())
    .pipe($.sass({
      errLogToConsole: true
    }))
    .pipe($.autoprefixer({
      browsers: ['last 2 versions', 'ie >= 10']
    }))
    .pipe($.sourcemaps.write())
    .pipe($.size({
      title: 'styles'
    }))
    .pipe(gulp.dest(appConfig.src + './css'))
    .pipe($.filter('**/*.css')) // Filtering stream to only css files
    .pipe(reload({
      stream: true
    }));
});

// Compile Handlebars partials into HTML views
gulp.task('handlebars', function() {

  // Set compileHandlebar partial path and helpers
  handlebarsOptions = {
    batch: appConfig.src + 'partials',
    helpers: {
      capitals: function(str) {
        return str.toUpperCase();
      }
    }
  };

  return gulp.src([
      appConfig.src + 'partials/*.{hbs,handlebars}',
      "!" + appConfig.src + 'partials/head.hbs',
      "!" + appConfig.src + 'partials/foot.hbs'
    ])
    .pipe($.compileHandlebars(handlebarsData, handlebarsOptions))
    .pipe($.rename(function(path) {
      path.extname = '.html';
    }))
    .pipe(gulp.dest(appConfig.src))
})

// Usemin to concat and minify CSS and Javascript
gulp.task('usemin', function() {
  return gulp.src(appConfig.src + '*.html')
    .pipe($.debug())
    .pipe($.usemin({
      // One option for each usemin block, or usemin won't run
      css: [$.minifyCss(), $.rev()],
      html: [],
      polyfilljs: [$.uglify(), $.rev()],
      headjs: [$.uglify(), $.rev()],
      js: [$.uglify(), $.rev()]
    }))
    .pipe($.debug())
    .pipe($.size({
      title: 'usemin'
    }))
    .pipe(gulp.dest(appConfig.dest));
})

gulp.task('usemin:norev', function() {
  return gulp.src(appConfig.src + '*.html')
    .pipe($.debug())
    .pipe($.usemin({
      // One option for each usemin block, or usemin won't run
      css: [$.minifyCss()],
      html: [],
      polyfilljs: [$.uglify()],
      headjs: [$.uglify()],
      js: [$.uglify()]
    }))
    .pipe($.debug())
    .pipe($.size({
      title: 'usemin'
    }))
    .pipe(gulp.dest(appConfig.dest));
})

// Imagemin 
gulp.task('images', function() {
  // Add svg later
  return gulp.src(appConfig.src + 'images/**/*.{png,jpg,gif}')
    .pipe($.cache($.imagemin({
      optimizationLevel: 5,
      progressive: true,
      interlaced: true,
      // multipass: true, 
    })))
    .pipe($.size({
      title: 'images'
    }))
    .pipe(gulp.dest(appConfig.dest + 'images'));
})

// Copy Web Fonts To Dist
gulp.task('fonts', function() {
  return gulp.src(appConfig.src + 'fonts')
    .pipe($.size({
      title: 'fonts'
    }))
    .pipe(gulp.dest(appConfig.dest + 'fonts'));
});

// Copy Files to root folder for Bower components 
gulp.task('copy:bower', function() {
  return gulp.src(appConfig.src + 'scss/_adaptive-placeholders.scss')
    .pipe(gulp.dest('./'));
})

gulp.task('watch', function() {
  gulp.watch(appConfig.src + 'scss/{,*/}*.{scss,sass}', ['styles']);
  gulp.watch(appConfig.src + 'js/{,*/}*.js', [reload]);
  gulp.watch(appConfig.src + 'partials/*.hbs', ['handlebars', reload]);
})

gulp.task('default', function(cb) {
  runSequence('browserSync', 'clean:dev', ['styles', 'handlebars'], 'watch', cb);
});

gulp.task('build', function(cb) {
  runSequence(['clean:dev', 'clean:dist'], ['styles', 'handlebars', 'images', 'fonts'], 'usemin', cb);
});

gulp.task('build:bower', function(cb) {
  runSequence(['clean:dev', 'clean:dist'], ['styles', 'handlebars', 'images', 'fonts', 'copy:bower'], cb);
});
