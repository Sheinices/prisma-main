(function () {
  'use strict';

  var tmdb_proxy = {
    path_image: 'img.prisma.ws/',
    path_api: 'apitmdb.' + (Prisma.Manifest && Prisma.Manifest.cub_domain ? Prisma.Manifest.cub_domain : 'cub.red') + '/3/'
  };
  Prisma.TMDB.image = function (url) {
    var base = Prisma.Utils.protocol() + 'image.tmdb.org/' + url;
    return Prisma.Storage.field('proxy_tmdb') ? Prisma.Utils.protocol() + tmdb_proxy.path_image + url : base;
  };
  Prisma.TMDB.api = function (url) {
    var base = Prisma.Utils.protocol() + 'api.themoviedb.org/3/' + url;
    return Prisma.Storage.field('proxy_tmdb') ? Prisma.Utils.protocol() + tmdb_proxy.path_api + url : base;
  };
  Prisma.Settings.listener.follow('open', function (e) {
    if (e.name == 'tmdb') {
      e.body.find('[data-parent="proxy"]').remove();
    }
  });
  console.log('TMDB-Proxy', 'started, enabled:', Prisma.Storage.field('proxy_tmdb'));

})();
// (function () {
//   'use strict';

//   Prisma.TMDB.image = function (url) {
//     var base = Prisma.Utils.protocol() + 'image.tmdb.org/' + url;
//     return Prisma.Storage.field('proxy_tmdb') ? 'https://api.prisma.ws/proxyimg/' + base : base;
//   };

//   Prisma.TMDB.api = function (url) {
//     var base = Prisma.Utils.protocol() + 'api.themoviedb.org/3/' + url;
//     return Prisma.Storage.field('proxy_tmdb') ? 'https://api.prisma.ws/proxy/' + base : base;
//   };

//   Prisma.Settings.listener.follow('open', function (e) {
//     if (e.name == 'tmdb') {
//       e.body.find('[data-parent="proxy"]').remove();
//     }
//   });

// })();
