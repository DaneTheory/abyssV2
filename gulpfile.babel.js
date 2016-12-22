import gulp from 'gulp'
import environments from 'gulp-environments'
import browserSync from 'browser-sync'
import htmlInjector from 'bs-html-injector'
import sass from 'gulp-sass'
import postcss from 'gulp-postcss'
import autoprefixer from 'autoprefixer'
import cssnano from 'gulp-cssnano'
import mqpacker from 'css-mqpacker'
import notify from 'gulp-notify'
import plumber from 'gulp-plumber'
import del from 'del'
import gutil from 'gulp-util'
import rename from 'gulp-rename'
import sasslint from 'gulp-sass-lint'
import sourcemaps from 'gulp-sourcemaps'
import nodemon from 'nodemon'


// Settings
const settings = {
  minifiedStyles: `style.min.css`,
  dev: `./environments/dev/`,
  prod: `./environments/prod/`,
  devStyles: `./environments/dev/styles/`,
  prodStyles: `./environments/prod/styles/`,
  devCSS: [ `./environments/dev/styles/*.css`, `!./environments/dev/styles/*.min.css`],
  srcStyles: `./src/frontEnd/scss/**/*.scss`,
}

const excludeFiles = {
  normalize: `!./src/frontEnd/scss/base/_normalize.scss`,
  styles: `!./src/frontEnd/scss/styles.scss`,
}

const development = environments.development,
      production = environments.production;


// Create Browser Sync Instance
const bs = browserSync.create()

// Handle Errors
const handleErrors = () => {
  let args = Array.prototype.slice.call(arguments);
  notify.onError({
    title: 'Task Failed [<%= error.message %>',
    message: 'See console.',
    sound: 'Sosumi'
 }).apply(this, args);
  gutil.beep();
  this.emit('end');
}


// Set Development Variable
gulp.task('set-dev', development.task);

// Clean Compiled Files
gulp.task('clean:styles', ['set-dev'], () => del([settings.prod]) );

// Compile Sass and Run Stylesheet Through PostCSS.
gulp.task('postcss', ['clean:styles'], () => {
  return gulp.src(settings.srcStyles)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(development(sourcemaps.init()))
    .pipe(sass({
          errLogToConsole: true,
          outputStyle: 'expanded',
    }))
    .pipe(postcss([
      autoprefixer({ browsers: ['last 2 version'] }),
      mqpacker({ sort: true }),
    ]))
    .pipe(development(sourcemaps.write()))
    .pipe(development(gulp.dest(settings.devStyles)))
    .pipe(production(gulp.dest(settings.prodStyles)))
    .pipe(development(bs.reload({stream: true})));
});

// Minify and Optimize style.css
gulp.task('cssnano', ['postcss'], () => {
  return gulp.src(settings.devCSS)
    .pipe(plumber({ errorHandler: handleErrors }))
    .pipe(production(cssnano({ safe: true })))
    .pipe(production(rename(settings.minifiedStyles)))
    .pipe(production(gulp.dest(settings.prodStyles)));
});

// Run Sass Through a Linter.
gulp.task('sass:lint', ['postcss'], () => {
  gulp.src([
    settings.srcStyles,
    excludeFiles.normalize,
    excludeFiles.styles,
  ])
  .pipe(sasslint())
  .pipe(sasslint.format())
  .pipe(sasslint.failOnError());
});

// Browser Sync
// gulp.task('bs', ['sass:lint'], () => {
//   bs.init({
//     open: true,
//     logFileChanges: true,
//     server: {
//       baseDir: './src',
//       index: 'frontEnd/views/index.html',
//       routes: {
//         '/environments': 'environments'
//       }
//     }
//   })
// });

// Nodemon
gulp.task('nodemon', ['sass:lint'], (cb) => {
	var started = false;
	return nodemon({
		script: './src/backEnd/server.js'
	}).on('start', () => {
		if (!started) {
			cb();
			started = true;
		}
	});
});

// Browser Sync
gulp.task('bs', ['nodemon'], () => {
	bs.init(null, {
		proxy: 'http://localhost:5000',
    files: ['environments/**/*.*'],
    port: 7000,
	});
});

// Default
gulp.task('default', ['bs'], () => {
    gulp.watch(settings.srcStyles, ['sass:lint']);
    gulp.watch(`./src/frontEnd/views/*.html`).on('change', bs.reload);
});
