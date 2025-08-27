(function () {
  'use strict';

  var Defined = {
    api: 'online',
    localhost: 'https://api.prisma.ws/',
    apn: ''
  };
  var Network = Prisma.Reguest;
  function component(object) {
    var network = new Network();
    var scroll = new Prisma.Scroll({
      mask: true,
      over: true
    });
    var files = new Prisma.Explorer(object);
    var filter = new Prisma.Filter(object);
    var sources = {};
    var last;
    var source;
    var balanser;
    var initialized;
    var balanser_timer;
    var images = [];
    var number_of_requests = 0;
    var number_of_requests_timer;
    var life_wait_times = 0;
    var life_wait_timer;
    var filter_sources = {};
    var filter_translate = {
      season: Prisma.Lang.translate('torrent_serial_season'),
      voice: Prisma.Lang.translate('torrent_parser_voice'),
      source: Prisma.Lang.translate('settings_rest_source')
    };
    var filter_find = {
      season: [],
      voice: []
    };
    var balansers_with_search = ['eneyida', 'seasonlet', 'lostfilmhd', 'kinotochka', 'kinopub', 'kinoprofi', 'kinokrad', 'kinobase', 'filmix', 'redheadsound', 'animevost', 'animego', 'animedia', 'animebesst', 'anilibria', 'rezka', 'kodik'];
    function account(url) {
      url = url + '';
      if (url.indexOf('account_email') == -1) {
        var email = Prisma.Storage.get('account_email');
        if (email) url = Prisma.Utils.addUrlComponent(url, 'account_email=' + encodeURIComponent(email));
      }
      return url;
    }
    function balanserName(j) {
      var bals = j.balanser;
      var name = j.name.split(' ')[0];
      return (bals || name).toLowerCase();
    }
    this.initialize = function () {
      var _this = this;
      this.loading(true);
      filter.onSearch = function (value) {
        Prisma.Activity.replace({
          search: value,
          clarification: true
        });
      };
      filter.onBack = function () {
        _this.start();
      };
      filter.render().find('.selector').on('hover:enter', function () {
        clearInterval(balanser_timer);
      });
      filter.render().find('.filter--search').appendTo(filter.render().find('.torrent-filter'));
      filter.onSelect = function (type, a, b) {
        if (type == 'filter') {
          if (a.reset) {
            _this.replaceChoice({
              season: 0,
              voice: 0,
              voice_url: '',
              voice_name: ''
            });
            setTimeout(function () {
              Prisma.Select.close();
              Prisma.Activity.replace();
            }, 10);
          } else {
            var url = filter_find[a.stype][b.index].url;
            var choice = _this.getChoice();
            if (a.stype == 'voice') {
              choice.voice_name = filter_find.voice[b.index].title;
              choice.voice_url = url;
            }
            choice[a.stype] = b.index;
            _this.saveChoice(choice);
            _this.reset();
            _this.request(url);
            setTimeout(Prisma.Select.close, 10);
          }
        } else if (type == 'sort') {
          Prisma.Select.close();
          object.online_custom_select = a.source;
          _this.changeBalanser(a.source);
        }
      };
      if (filter.addButtonBack) filter.addButtonBack();
      filter.render().find('.filter--sort span').text(Prisma.Lang.translate('online_balanser'));
      scroll.body().addClass('torrent-list');
      files.appendFiles(scroll.render());
      files.appendHead(filter.render());
      scroll.minus(files.render().find('.explorer__files-head'));
      scroll.body().append(Prisma.Template.get('online_content_loading'));
      Prisma.Controller.enable('content');
      this.loading(false);
      this.externalids().then(function () {
        return _this.createSource();
      }).then(function (wait) {
        if (!balansers_with_search.find(function (b) {
          return balanser.slice(0, b.length) == b;
        })) {
          filter.render().find('.filter--search').addClass('hide');
        }
        _this.search();
      })["catch"](function (e) {
        _this.noConnectToServer(e);
      });
    };
    this.externalids = function () {
      return new Promise(function (resolve, reject) {
        if (!object.movie.imdb_id || !object.movie.kinopoisk_id) {
          var query = [];
          query.push('id=' + object.movie.id);
          query.push('serial=' + (object.movie.name ? 1 : 0));
          if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
          if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
          var url = Defined.localhost + 'externalids?' + query.join('&');
          network.timeout(10000);
          network.silent(account(url), function (json) {
            for (var name in json) {
              object.movie[name] = json[name];
            }
            resolve();
          }, function () {
            resolve();
          });
        } else resolve();
      });
    };
    this.updateBalanser = function (balanser_name) {
      var last_select_balanser = Prisma.Storage.cache('online_last_balanser', 3000, {});
      last_select_balanser[object.movie.id] = balanser_name;
      Prisma.Storage.set('online_last_balanser', last_select_balanser);
    };
    this.changeBalanser = function (balanser_name) {
      this.updateBalanser(balanser_name);
      Prisma.Storage.set('online_balanser', balanser_name);
      var to = this.getChoice(balanser_name);
      var from = this.getChoice();
      if (from.voice_name) to.voice_name = from.voice_name;
      this.saveChoice(to, balanser_name);
      Prisma.Activity.replace();
    };
    this.requestParams = function (url) {
      var query = [];
      var card_source = object.movie.source || 'tmdb'; //Prisma.Storage.field('source')
      query.push('id=' + object.movie.id);
      if (object.movie.imdb_id) query.push('imdb_id=' + (object.movie.imdb_id || ''));
      if (object.movie.kinopoisk_id) query.push('kinopoisk_id=' + (object.movie.kinopoisk_id || ''));
      query.push('title=' + encodeURIComponent(object.clarification ? object.search : object.movie.title || object.movie.name));
      query.push('original_title=' + encodeURIComponent(object.movie.original_title || object.movie.original_name));
      query.push('serial=' + (object.movie.name ? 1 : 0));
      query.push('original_language=' + (object.movie.original_language || ''));
      query.push('year=' + ((object.movie.release_date || object.movie.first_air_date || '0000') + '').slice(0, 4));
      query.push('source=' + card_source);
      query.push('clarification=' + (object.clarification ? 1 : 0));
      if (Prisma.Storage.get('account_email', '')) query.push('cub_id=' + Prisma.Utils.hash(Prisma.Storage.get('account_email', '')));
      return url + (url.indexOf('?') >= 0 ? '&' : '?') + query.join('&');
    };
    this.getLastChoiceBalanser = function () {
      var last_select_balanser = Prisma.Storage.cache('online_last_balanser', 3000, {});
      if (last_select_balanser[object.movie.id]) {
        return last_select_balanser[object.movie.id];
      } else {
        return Prisma.Storage.get('online_balanser', filter_sources.length ? filter_sources[0] : '');
      }
    };
    this.startSource = function (json) {
      return new Promise(function (resolve, reject) {
        json.forEach(function (j) {
          var name = balanserName(j);
          sources[name] = {
            url: j.url,
            name: j.name,
            show: typeof j.show == 'undefined' ? true : j.show
          };
        });
        filter_sources = Prisma.Arrays.getKeys(sources);
        if (filter_sources.length) {
          var last_select_balanser = Prisma.Storage.cache('online_last_balanser', 3000, {});
          if (last_select_balanser[object.movie.id]) {
            balanser = last_select_balanser[object.movie.id];
          } else {
            balanser = Prisma.Storage.get('online_balanser', filter_sources[0]);
          }
          if (!sources[balanser]) balanser = filter_sources[0];
          if (!sources[balanser].show && !object.online_custom_select) balanser = filter_sources[0];
          source = sources[balanser].url;
          resolve();
        } else {
          reject();
        }
      });
    };
    this.lifeSource = function () {
      var _this2 = this;
      return new Promise(function (resolve, reject) {
        var url = _this2.requestParams(Defined.localhost + 'lifeevents');
        var red = false;
        var gou = function gou(json, any) {
          if (json.accsdb) return reject(json);
          var last_balanser = _this2.getLastChoiceBalanser();
          if (!red) {
            var _filter = json.online.filter(function (c) {
              return any ? c.show : c.show && c.name.toLowerCase() == last_balanser;
            });
            if (_filter.length) {
              red = true;
              resolve(json.online.filter(function (c) {
                return c.show;
              }));
            } else if (any) {
              reject();
            }
          }
        };
        var fin = function fin(call) {
          network.timeout(3000);
          network.silent(account(url), function (json) {
            life_wait_times++;
            filter_sources = [];
            sources = {};
            json.online.forEach(function (j) {
              var name = balanserName(j);
              sources[name] = {
                url: j.url,
                name: j.name,
                show: typeof j.show == 'undefined' ? true : j.show
              };
            });
            filter_sources = Prisma.Arrays.getKeys(sources);
            filter.set('sort', filter_sources.map(function (e) {
              return {
                title: sources[e].name,
                source: e,
                selected: e == balanser,
                ghost: !sources[e].show
              };
            }));
            filter.chosen('sort', [sources[balanser] ? sources[balanser].name : balanser]);
            gou(json);
            var lastb = _this2.getLastChoiceBalanser();
            if (life_wait_times > 15 || json.ready) {
              filter.render().find('.online-balanser-loader').remove();
              gou(json, true);
            } else if (!red && sources[lastb] && sources[lastb].show) {
              gou(json, true);
              life_wait_timer = setTimeout(fin, 1000);
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          }, function () {
            life_wait_times++;
            if (life_wait_times > 15) {
              reject();
            } else {
              life_wait_timer = setTimeout(fin, 1000);
            }
          });
        };
        fin();
      });
    };
    this.createSource = function () {
      var _this3 = this;
      return new Promise(function (resolve, reject) {
        var url = _this3.requestParams(Defined.localhost + 'lite/events?life=true');
        network.timeout(15000);
        network.silent(account(url), function (json) {
          if (json.accsdb) return reject(json);
          if (json.life) {
            filter.render().find('.filter--sort').append('<span class="online-balanser-loader" style="width: 1.2em; height: 1.2em; margin-top: 0; background: url(./img/loader.svg) no-repeat 50% 50%; background-size: contain; margin-left: 0.5em"></span>');
            _this3.lifeSource().then(_this3.startSource).then(resolve)["catch"](reject);
          } else {
            _this3.startSource(json).then(resolve)["catch"](reject);
          }
        }, reject);
      });
    };
    /**
     * Подготовка
     */
    this.create = function () {
      return this.render();
    };
    /**
     * Начать поиск
     */
    this.search = function () {
      //this.loading(true)
      this.filter({
        source: filter_sources
      }, this.getChoice());
      this.find();
    };
    this.find = function () {
      this.request(this.requestParams(source));
    };
    this.request = function (url) {
      number_of_requests++;
      if (number_of_requests < 10) {
        network["native"](account(url), this.parse.bind(this), this.doesNotAnswer.bind(this), false, {
          dataType: 'text'
        });
        clearTimeout(number_of_requests_timer);
        number_of_requests_timer = setTimeout(function () {
          number_of_requests = 0;
        }, 4000);
      } else this.empty();
    };
    this.parseJsonDate = function (str, name) {
      try {
        var html = $('<div>' + str + '</div>');
        var elems = [];
        html.find(name).each(function () {
          var item = $(this);
          var data = JSON.parse(item.attr('data-json'));
          var season = item.attr('s');
          var episode = item.attr('e');
          var text = item.text();
          if (!object.movie.name) {
            if (text.match(/\d+p/i)) {
              if (!data.quality) {
                data.quality = {};
                data.quality[text] = data.url;
              }
              text = object.movie.title;
            }
            if (text == 'По умолчанию') {
              text = object.movie.title;
            }
          }
          if (episode) data.episode = parseInt(episode);
          if (season) data.season = parseInt(season);
          if (text) data.text = text;
          data.active = item.hasClass('active');
          elems.push(data);
        });
        return elems;
      } catch (e) {
        return [];
      }
    };
    this.getFileUrl = function (file, call) {
      if (file.method == 'play') call(file, {});else {
        Prisma.Loading.start(function () {
          Prisma.Loading.stop();
          Prisma.Controller.toggle('content');
          network.clear();
        });
        network["native"](account(file.url), function (json) {
          Prisma.Loading.stop();
          call(json, json);
        }, function () {
          Prisma.Loading.stop();
          call(false, {});
        });
      }
    };
    this.toPlayElement = function (file) {
      var play = {
        title: file.title,
        url: file.url,
        quality: file.qualitys,
        timeline: file.timeline,
        subtitles: file.subtitles,
        callback: file.mark
      };
      return play;
    };
    this.appendAPN = function (data) {
      if (Defined.api.indexOf('pwa') == 0 && Defined.apn.length && data.url && typeof data.url == 'string' && data.url.indexOf(Defined.apn) == -1) data.url_reserve = Defined.apn + data.url;
    };
    this.setDefaultQuality = function (data) {
      if (Prisma.Arrays.getKeys(data.quality).length) {
        for (var q in data.quality) {
          if (parseInt(q) == Prisma.Storage.field('video_quality_default')) {
            data.url = data.quality[q];
            this.appendAPN(data);
            break;
          }
        }
      }
    };
    this.display = function (videos) {
      var _this4 = this;
      this.draw(videos, {
        onEnter: function onEnter(item, html) {
          _this4.getFileUrl(item, function (json, json_call) {
            if (json && json.url) {
              var playlist = [];
              var first = _this4.toPlayElement(item);
              first.url = json.url;
              first.quality = json_call.quality || item.qualitys;
              first.subtitles = json.subtitles;
              _this4.appendAPN(first);
              _this4.setDefaultQuality(first);
              if (item.season) {
                videos.forEach(function (elem) {
                  var cell = _this4.toPlayElement(elem);
                  if (elem == item) cell.url = json.url;else {
                    if (elem.method == 'call') {
                      if (Prisma.Platform.is('android') && Prisma.Storage.field('player') == 'android') {
                        cell.url = elem.stream;
                      } else {
                        cell.url = function (call) {
                          _this4.getFileUrl(elem, function (stream, stream_json) {
                            if (stream.url) {
                              cell.url = stream.url;
                              cell.quality = stream_json.quality || elem.qualitys;
                              cell.subtitles = stream.subtitles;
                              _this4.appendAPN(cell);
                              _this4.setDefaultQuality(cell);
                              elem.mark();
                            } else {
                              cell.url = '';
                              Prisma.Noty.show(Prisma.Lang.translate('online_nolink'));
                            }
                            call();
                          }, function () {
                            cell.url = '';
                            call();
                          });
                        };
                      }
                    } else {
                      cell.url = elem.url;
                    }
                  }
                  _this4.appendAPN(cell);
                  _this4.setDefaultQuality(cell);
                  playlist.push(cell);
                }); //Prisma.Player.playlist(playlist) 
              } else {
                playlist.push(first);
              }
              if (playlist.length > 1) first.playlist = playlist;
              if (first.url) {
                Prisma.Player.play(first);
                Prisma.Player.playlist(playlist);
                item.mark();
                _this4.updateBalanser(balanser);
              } else {
                Prisma.Noty.show(Prisma.Lang.translate('online_nolink'));
              }
            } else Prisma.Noty.show(Prisma.Lang.translate('online_nolink'));
          }, true);
        },
        onContextMenu: function onContextMenu(item, html, data, call) {
          _this4.getFileUrl(item, function (stream) {
            call({
              file: stream,
              quality: item.qualitys
            });
          }, true);
        }
      });
      this.filter({
        season: filter_find.season.map(function (s) {
          return s.title;
        }),
        voice: filter_find.voice.map(function (b) {
          return b.title;
        })
      }, this.getChoice());
    };
    this.parse = function (str) {
      try {
        var items = this.parseJsonDate(str, '.videos__item');
        var buttons = this.parseJsonDate(str, '.videos__button');
        if (items.length == 1 && items[0].method == 'link' && !items[0].similar) {
          filter_find.season = items.map(function (s) {
            return {
              title: s.text,
              url: s.url
            };
          });
          this.replaceChoice({
            season: 0
          });
          this.request(items[0].url);
        } else {
          this.activity.loader(false);
          var videos = items.filter(function (v) {
            return v.method == 'play' || v.method == 'call';
          });
          var similar = items.filter(function (v) {
            return v.similar;
          });
          if (videos.length) {
            if (buttons.length) {
              filter_find.voice = buttons.map(function (b) {
                return {
                  title: b.text,
                  url: b.url
                };
              });
              var select_voice_url = this.getChoice(balanser).voice_url;
              var select_voice_name = this.getChoice(balanser).voice_name;
              var find_voice_url = buttons.find(function (v) {
                return v.url == select_voice_url;
              });
              var find_voice_name = buttons.find(function (v) {
                return v.text == select_voice_name;
              });
              var find_voice_active = buttons.find(function (v) {
                return v.active;
              }); //console.log('b',buttons)
              //console.log('u',find_voice_url)
              //console.log('n',find_voice_name)
              //console.log('a',find_voice_active)
              if (find_voice_url && !find_voice_url.active) {
                console.log('online', 'go to voice', find_voice_url);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_url),
                  voice_name: find_voice_url.text
                });
                this.request(find_voice_url.url);
              } else if (find_voice_name && !find_voice_name.active) {
                console.log('online', 'go to voice', find_voice_name);
                this.replaceChoice({
                  voice: buttons.indexOf(find_voice_name),
                  voice_name: find_voice_name.text
                });
                this.request(find_voice_name.url);
              } else {
                if (find_voice_active) {
                  this.replaceChoice({
                    voice: buttons.indexOf(find_voice_active),
                    voice_name: find_voice_active.text
                  });
                }
                this.display(videos);
              }
            } else {
              this.replaceChoice({
                voice: 0,
                voice_url: '',
                voice_name: ''
              });
              this.display(videos);
            }
          } else if (items.length) {
            if (similar.length) {
              this.similars(similar);
              this.activity.loader(false);
            } else {
              //this.activity.loader(true)
              filter_find.season = items.map(function (s) {
                return {
                  title: s.text,
                  url: s.url
                };
              });
              var select_season = this.getChoice(balanser).season;
              var season = filter_find.season[select_season];
              if (!season) season = filter_find.season[0];
              console.log('online', 'go to season', season);
              this.request(season.url);
            }
          } else {
            this.doesNotAnswer();
          }
        }
      } catch (e) {
        console.log('online', 'error', e.stack);
        this.doesNotAnswer();
      }
    };
    this.similars = function (json) {
      var _this5 = this;
      scroll.clear();
      json.forEach(function (elem) {
        elem.title = elem.text;
        elem.info = '';
        var info = [];
        var year = ((elem.start_date || elem.year || object.movie.release_date || object.movie.first_air_date || '') + '').slice(0, 4);
        if (year) info.push(year);
        if (elem.details) info.push(elem.details);
        var name = elem.title || elem.text;
        elem.title = name;
        elem.time = elem.time || '';
        elem.info = info.join('<span class="online-prestige-split">●</span>');
        var item = Prisma.Template.get('online_prestige_folder', elem);
        item.on('hover:enter', function () {
          _this5.reset();
          _this5.request(elem.url);
        }).on('hover:focus', function (e) {
          last = e.target;
          scroll.update($(e.target), true);
        });
        scroll.append(item);
      });
      Prisma.Controller.enable('content');
    };
    this.getChoice = function (for_balanser) {
      var data = Prisma.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      var save = data[object.movie.id] || {};
      Prisma.Arrays.extend(save, {
        season: 0,
        voice: 0,
        voice_name: '',
        voice_id: 0,
        episodes_view: {},
        movie_view: ''
      });
      return save;
    };
    this.saveChoice = function (choice, for_balanser) {
      var data = Prisma.Storage.cache('online_choice_' + (for_balanser || balanser), 3000, {});
      data[object.movie.id] = choice;
      Prisma.Storage.set('online_choice_' + (for_balanser || balanser), data);
      this.updateBalanser(for_balanser || balanser);
    };
    this.replaceChoice = function (choice, for_balanser) {
      var to = this.getChoice(for_balanser);
      Prisma.Arrays.extend(to, choice, true);
      this.saveChoice(to, for_balanser);
    };
    this.clearImages = function () {
      images.forEach(function (img) {
        img.onerror = function () {};
        img.onload = function () {};
        img.src = '';
      });
      images = [];
    };
    /**
     * Очистить список файлов
     */
    this.reset = function () {
      last = false;
      clearInterval(balanser_timer);
      network.clear();
      this.clearImages();
      scroll.render().find('.empty').remove();
      scroll.clear();
      scroll.reset();
      scroll.body().append(Prisma.Template.get('online_content_loading'));
    };
    /**
     * Загрузка
     */
    this.loading = function (status) {
      if (status) this.activity.loader(true);else {
        this.activity.loader(false);
        this.activity.toggle();
      }
    };
    /**
     * Построить фильтр
     */
    this.filter = function (filter_items, choice) {
      var _this6 = this;
      var select = [];
      var add = function add(type, title) {
        var need = _this6.getChoice();
        var items = filter_items[type];
        var subitems = [];
        var value = need[type];
        items.forEach(function (name, i) {
          subitems.push({
            title: name,
            selected: value == i,
            index: i
          });
        });
        select.push({
          title: title,
          subtitle: items[value],
          items: subitems,
          stype: type
        });
      };
      filter_items.source = filter_sources;
      select.push({
        title: Prisma.Lang.translate('torrent_parser_reset'),
        reset: true
      });
      this.saveChoice(choice);
      if (filter_items.voice && filter_items.voice.length) add('voice', Prisma.Lang.translate('torrent_parser_voice'));
      if (filter_items.season && filter_items.season.length) add('season', Prisma.Lang.translate('torrent_serial_season'));
      filter.set('filter', select);
      filter.set('sort', filter_sources.map(function (e) {
        return {
          title: sources[e].name,
          source: e,
          selected: e == balanser,
          ghost: !sources[e].show
        };
      }));
      this.selected(filter_items);
    };
    /**
     * Показать что выбрано в фильтре
     */
    this.selected = function (filter_items) {
      var need = this.getChoice(),
        select = [];
      for (var i in need) {
        if (filter_items[i] && filter_items[i].length) {
          if (i == 'voice') {
            select.push(filter_translate[i] + ': ' + filter_items[i][need[i]]);
          } else if (i !== 'source') {
            if (filter_items.season.length >= 1) {
              select.push(filter_translate.season + ': ' + filter_items[i][need[i]]);
            }
          }
        }
      }
      filter.chosen('filter', select);
      filter.chosen('sort', [sources[balanser].name]);
    };
    this.getEpisodes = function (season, call) {
      var episodes = [];
      if (['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) return call(episodes);
      if (typeof object.movie.id == 'number' && object.movie.name) {
        var tmdburl = 'tv/' + object.movie.id + '/season/' + season + '?api_key=' + Prisma.TMDB.key() + '&language=' + Prisma.Storage.get('language', 'ru');
        var baseurl = Prisma.TMDB.api(tmdburl);
        network.timeout(1000 * 10);
        network["native"](baseurl, function (data) {
          episodes = data.episodes || [];
          call(episodes);
        }, function (a, c) {
          call(episodes);
        });
      } else call(episodes);
    };
    this.watched = function (set) {
      var file_id = Prisma.Utils.hash(object.movie.number_of_seasons ? object.movie.original_name : object.movie.original_title);
      var watched = Prisma.Storage.cache('online_watched_last', 5000, {});
      if (set) {
        if (!watched[file_id]) watched[file_id] = {};
        Prisma.Arrays.extend(watched[file_id], set, true);
        Prisma.Storage.set('online_watched_last', watched);
        this.updateWatched();
      } else {
        return watched[file_id];
      }
    };
    this.updateWatched = function () {
      var watched = this.watched();
      var body = scroll.body().find('.online-prestige-watched .online-prestige-watched__body').empty();
      if (watched) {
        var line = [];
        if (watched.balanser_name) line.push(watched.balanser_name);
        if (watched.voice_name) line.push(watched.voice_name);
        if (watched.season) line.push(Prisma.Lang.translate('torrent_serial_season') + ' ' + watched.season);
        if (watched.episode) line.push(Prisma.Lang.translate('torrent_serial_episode') + ' ' + watched.episode);
        line.forEach(function (n) {
          body.append('<span>' + n + '</span>');
        });
      } else body.append('<span>' + Prisma.Lang.translate('online_no_watch_history') + '</span>');
    };
    /**
     * Отрисовка файлов
     */
    this.draw = function (items) {
      var _this7 = this;
      var params = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      if (!items.length) return this.empty();
      scroll.clear();
      scroll.append(Prisma.Template.get('online_prestige_watched', {}));
      this.updateWatched();
      this.getEpisodes(items[0].season, function (episodes) {
        var viewed = Prisma.Storage.cache('online_view', 5000, []);
        var serial = object.movie.name ? true : false;
        var choice = _this7.getChoice();
        var fully = window.innerWidth > 480;
        var scroll_to_element = false;
        var scroll_to_mark = false;
        items.forEach(function (element, index) {
          var episode = serial && episodes.length && !params.similars ? episodes.find(function (e) {
            return e.episode_number == element.episode;
          }) : false;
          var episode_num = element.episode || index + 1;
          var episode_last = choice.episodes_view[element.season];
          var voice_name = choice.voice_name || (filter_find.voice[0] ? filter_find.voice[0].title : false) || element.voice_name || (serial ? 'Неизвестно' : element.text) || 'Неизвестно';
          if (element.quality) {
            element.qualitys = element.quality;
            element.quality = Prisma.Arrays.getKeys(element.quality)[0];
          }
          Prisma.Arrays.extend(element, {
            voice_name: voice_name,
            info: voice_name.length > 60 ? voice_name.substr(0, 60) + '...' : voice_name,
            quality: '',
            time: Prisma.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true)
          });
          var hash_timeline = Prisma.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title].join('') : object.movie.original_title);
          var hash_behold = Prisma.Utils.hash(element.season ? [element.season, element.season > 10 ? ':' : '', element.episode, object.movie.original_title, element.voice_name].join('') : object.movie.original_title + element.voice_name);
          var data = {
            hash_timeline: hash_timeline,
            hash_behold: hash_behold
          };
          var info = [];
          if (element.season) {
            element.translate_episode_end = _this7.getLastEpisode(items);
            element.translate_voice = element.voice_name;
          }
          if (element.text && !episode) element.title = element.text;
          element.timeline = Prisma.Timeline.view(hash_timeline);
          if (episode) {
            element.title = episode.name;
            if (element.info.length < 30 && episode.vote_average) info.push(Prisma.Template.get('online_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date && fully) info.push(Prisma.Utils.parseTime(episode.air_date).full);
          } else if (object.movie.release_date && fully) {
            info.push(Prisma.Utils.parseTime(object.movie.release_date).full);
          }
          if (!serial && object.movie.tagline && element.info.length < 30) info.push(object.movie.tagline);
          if (element.info) info.push(element.info);
          if (info.length) element.info = info.map(function (i) {
            return '<span>' + i + '</span>';
          }).join('<span class="online-prestige-split">●</span>');
          var html = Prisma.Template.get('online_prestige_full', element);
          var loader = html.find('.online-prestige__loader');
          var image = html.find('.online-prestige__img');
          if (!serial) {
            if (choice.movie_view == hash_behold) scroll_to_element = html;
          } else if (typeof episode_last !== 'undefined' && episode_last == episode_num) {
            scroll_to_element = html;
          }
          if (serial && !episode) {
            image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            loader.remove();
          } else if (!serial && ['cub', 'tmdb'].indexOf(object.movie.source || 'tmdb') == -1) loader.remove();else {
            var img = html.find('img')[0];
            img.onerror = function () {
              img.src = './img/img_broken.svg';
            };
            img.onload = function () {
              image.addClass('online-prestige__img--loaded');
              loader.remove();
              if (serial) image.append('<div class="online-prestige__episode-number">' + ('0' + (element.episode || index + 1)).slice(-2) + '</div>');
            };
            img.src = Prisma.TMDB.image('t/p/w300' + (episode ? episode.still_path : object.movie.backdrop_path));
            images.push(img);
          }
          html.find('.online-prestige__timeline').append(Prisma.Timeline.render(element.timeline));
          if (viewed.indexOf(hash_behold) !== -1) {
            scroll_to_mark = html;
            html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Prisma.Template.get('icon_viewed', {}, true) + '</div>');
          }
          element.mark = function () {
            viewed = Prisma.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) == -1) {
              viewed.push(hash_behold);
              Prisma.Storage.set('online_view', viewed);
              if (html.find('.online-prestige__viewed').length == 0) {
                html.find('.online-prestige__img').append('<div class="online-prestige__viewed">' + Prisma.Template.get('icon_viewed', {}, true) + '</div>');
              }
            }
            choice = _this7.getChoice();
            if (!serial) {
              choice.movie_view = hash_behold;
            } else {
              choice.episodes_view[element.season] = episode_num;
            }
            _this7.saveChoice(choice);
            var voice_name_text = choice.voice_name || element.voice_name || element.title;
            if (voice_name_text.length > 30) voice_name_text = voice_name_text.slice(0, 30) + '...';
            _this7.watched({
              balanser: balanser,
              balanser_name: Prisma.Utils.capitalizeFirstLetter(sources[balanser].name.split(' ')[0]),
              voice_id: choice.voice_id,
              voice_name: voice_name_text,
              episode: element.episode,
              season: element.season
            });
          };
          element.unmark = function () {
            viewed = Prisma.Storage.cache('online_view', 5000, []);
            if (viewed.indexOf(hash_behold) !== -1) {
              Prisma.Arrays.remove(viewed, hash_behold);
              Prisma.Storage.set('online_view', viewed);
              Prisma.Storage.remove('online_view', hash_behold);
              html.find('.online-prestige__viewed').remove();
            }
          };
          element.timeclear = function () {
            element.timeline.percent = 0;
            element.timeline.time = 0;
            element.timeline.duration = 0;
            Prisma.Timeline.update(element.timeline);
          };
          html.on('hover:enter', function () {
            if (object.movie.id) Prisma.Favorite.add('history', object.movie, 100);
            if (params.onEnter) params.onEnter(element, html, data);
          }).on('hover:focus', function (e) {
            last = e.target;
            if (params.onFocus) params.onFocus(element, html, data);
            scroll.update($(e.target), true);
          });
          if (params.onRender) params.onRender(element, html, data);
          _this7.contextMenu({
            html: html,
            element: element,
            onFile: function onFile(call) {
              if (params.onContextMenu) params.onContextMenu(element, html, data, call);
            },
            onClearAllMark: function onClearAllMark() {
              items.forEach(function (elem) {
                elem.unmark();
              });
            },
            onClearAllTime: function onClearAllTime() {
              items.forEach(function (elem) {
                elem.timeclear();
              });
            }
          });
          scroll.append(html);
        });
        if (serial && episodes.length > items.length && !params.similars) {
          var left = episodes.slice(items.length);
          left.forEach(function (episode) {
            var info = [];
            if (episode.vote_average) info.push(Prisma.Template.get('online_prestige_rate', {
              rate: parseFloat(episode.vote_average + '').toFixed(1)
            }, true));
            if (episode.air_date) info.push(Prisma.Utils.parseTime(episode.air_date).full);
            var air = new Date((episode.air_date + '').replace(/-/g, '/'));
            var now = Date.now();
            var day = Math.round((air.getTime() - now) / (24 * 60 * 60 * 1000));
            var txt = Prisma.Lang.translate('full_episode_days_left') + ': ' + day;
            var html = Prisma.Template.get('online_prestige_full', {
              time: Prisma.Utils.secondsToTime((episode ? episode.runtime : object.movie.runtime) * 60, true),
              info: info.length ? info.map(function (i) {
                return '<span>' + i + '</span>';
              }).join('<span class="online-prestige-split">●</span>') : '',
              title: episode.name,
              quality: day > 0 ? txt : ''
            });
            var loader = html.find('.online-prestige__loader');
            var image = html.find('.online-prestige__img');
            var season = items[0] ? items[0].season : 1;
            html.find('.online-prestige__timeline').append(Prisma.Timeline.render(Prisma.Timeline.view(Prisma.Utils.hash([season, episode.episode_number, object.movie.original_title].join('')))));
            var img = html.find('img')[0];
            if (episode.still_path) {
              img.onerror = function () {
                img.src = './img/img_broken.svg';
              };
              img.onload = function () {
                image.addClass('online-prestige__img--loaded');
                loader.remove();
                image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
              };
              img.src = Prisma.TMDB.image('t/p/w300' + episode.still_path);
              images.push(img);
            } else {
              loader.remove();
              image.append('<div class="online-prestige__episode-number">' + ('0' + episode.episode_number).slice(-2) + '</div>');
            }
            html.on('hover:focus', function (e) {
              last = e.target;
              scroll.update($(e.target), true);
            });
            html.css('opacity', '0.5');
            scroll.append(html);
          });
        }
        if (scroll_to_element) {
          last = scroll_to_element[0];
        } else if (scroll_to_mark) {
          last = scroll_to_mark[0];
        }
        Prisma.Controller.enable('content');
      });
    };
    /**
     * Меню
     */
    this.contextMenu = function (params) {
      params.html.on('hover:long', function () {
        function show(extra) {
          var enabled = Prisma.Controller.enabled().name;
          var menu = [];
          if (Prisma.Platform.is('webos')) {
            menu.push({
              title: Prisma.Lang.translate('player_lauch') + ' - Webos',
              player: 'webos'
            });
          }
          if (Prisma.Platform.is('android')) {
            menu.push({
              title: Prisma.Lang.translate('player_lauch') + ' - Android',
              player: 'android'
            });
          }
          menu.push({
            title: Prisma.Lang.translate('player_lauch') + ' - Prisma',
            player: 'Prisma'
          });
          menu.push({
            title: Prisma.Lang.translate('online_video'),
            separator: true
          });
          menu.push({
            title: Prisma.Lang.translate('torrent_parser_label_title'),
            mark: true
          });
          menu.push({
            title: Prisma.Lang.translate('torrent_parser_label_cancel_title'),
            unmark: true
          });
          menu.push({
            title: Prisma.Lang.translate('time_reset'),
            timeclear: true
          });
          if (extra) {
            menu.push({
              title: Prisma.Lang.translate('copy_link'),
              copylink: true
            });
          }
          menu.push({
            title: Prisma.Lang.translate('more'),
            separator: true
          });
          if (Prisma.Account.logged() && params.element && typeof params.element.season !== 'undefined' && params.element.translate_voice) {
            menu.push({
              title: Prisma.Lang.translate('online_voice_subscribe'),
              subscribe: true
            });
          }
          menu.push({
            title: Prisma.Lang.translate('online_clear_all_marks'),
            clearallmark: true
          });
          menu.push({
            title: Prisma.Lang.translate('online_clear_all_timecodes'),
            timeclearall: true
          });
          Prisma.Select.show({
            title: Prisma.Lang.translate('title_action'),
            items: menu,
            onBack: function onBack() {
              Prisma.Controller.toggle(enabled);
            },
            onSelect: function onSelect(a) {
              if (a.mark) params.element.mark();
              if (a.unmark) params.element.unmark();
              if (a.timeclear) params.element.timeclear();
              if (a.clearallmark) params.onClearAllMark();
              if (a.timeclearall) params.onClearAllTime();
              Prisma.Controller.toggle(enabled);
              if (a.player) {
                Prisma.Player.runas(a.player);
                params.html.trigger('hover:enter');
              }
              if (a.copylink) {
                if (extra.quality) {
                  var qual = [];
                  for (var i in extra.quality) {
                    qual.push({
                      title: i,
                      file: extra.quality[i]
                    });
                  }
                  Prisma.Select.show({
                    title: Prisma.Lang.translate('settings_server_links'),
                    items: qual,
                    onBack: function onBack() {
                      Prisma.Controller.toggle(enabled);
                    },
                    onSelect: function onSelect(b) {
                      Prisma.Utils.copyTextToClipboard(b.file, function () {
                        Prisma.Noty.show(Prisma.Lang.translate('copy_secuses'));
                      }, function () {
                        Prisma.Noty.show(Prisma.Lang.translate('copy_error'));
                      });
                    }
                  });
                } else {
                  Prisma.Utils.copyTextToClipboard(extra.file, function () {
                    Prisma.Noty.show(Prisma.Lang.translate('copy_secuses'));
                  }, function () {
                    Prisma.Noty.show(Prisma.Lang.translate('copy_error'));
                  });
                }
              }
              if (a.subscribe) {
                Prisma.Account.subscribeToTranslation({
                  card: object.movie,
                  season: params.element.season,
                  episode: params.element.translate_episode_end,
                  voice: params.element.translate_voice
                }, function () {
                  Prisma.Noty.show(Prisma.Lang.translate('online_voice_success'));
                }, function () {
                  Prisma.Noty.show(Prisma.Lang.translate('online_voice_error'));
                });
              }
            }
          });
        }
        params.onFile(show);
      }).on('hover:focus', function () {
        if (Prisma.Helper) Prisma.Helper.show('online_file', Prisma.Lang.translate('helper_online_file'), params.html);
      });
    };
    /**
     * Показать пустой результат
     */
    this.empty = function () {
      var html = Prisma.Template.get('online_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Prisma.Lang.translate('empty_title_two'));
      html.find('.online-empty__time').text(Prisma.Lang.translate('empty_text'));
      scroll.clear();
      scroll.append(html);
      this.loading(false);
    };
    this.noConnectToServer = function (er) {
      var html = Prisma.Template.get('online_does_not_answer', {});
      html.find('.online-empty__buttons').remove();
      html.find('.online-empty__title').text(Prisma.Lang.translate('title_error'));
      html.find('.online-empty__time').text(er && er.accsdb ? er.msg : Prisma.Lang.translate('online_does_not_answer_text'));
      files.appendHead(html);
      this.loading(false);
    };
    this.doesNotAnswer = function () {
      var _this8 = this;
      this.reset();
      var html = Prisma.Template.get('online_does_not_answer', {
        balanser: balanser
      });
      var tic = 4;
      html.find('.cancel').on('hover:enter', function () {
        clearInterval(balanser_timer);
      });
      html.find('.change').on('hover:enter', function () {
        clearInterval(balanser_timer);
        filter.render().find('.filter--sort').trigger('hover:enter');
      });
      scroll.clear();
      scroll.append(html);
      this.loading(false);
      balanser_timer = setInterval(function () {
        tic--;
        html.find('.timeout').text(tic);
        if (tic == 0) {
          clearInterval(balanser_timer);
          var keys = Prisma.Arrays.getKeys(sources);
          var indx = keys.indexOf(balanser);
          var next = keys[indx + 1];
          if (!next) next = keys[0];
          balanser = next;
          if (Prisma.Activity.active().activity == _this8.activity) _this8.changeBalanser(balanser);
        }
      }, 1000);
    };
    this.getLastEpisode = function (items) {
      var last_episode = 0;
      items.forEach(function (e) {
        if (typeof e.episode !== 'undefined') last_episode = Math.max(last_episode, parseInt(e.episode));
      });
      return last_episode;
    };
    /**
     * Начать навигацию по файлам
     */
    this.start = function () {
      if (Prisma.Activity.active().activity !== this.activity) return;
      if (!initialized) {
        initialized = true;
        this.initialize();
      }
      Prisma.Background.immediately(Prisma.Utils.cardImgBackgroundBlur(object.movie));
      Prisma.Controller.add('content', {
        toggle: function toggle() {
          Prisma.Controller.collectionSet(scroll.render(), files.render());
          Prisma.Controller.collectionFocus(last || false, scroll.render());
        },
        gone: function gone() {
          clearTimeout(balanser_timer);
        },
        up: function up() {
          if (Navigator.canmove('up')) {
            Navigator.move('up');
          } else Prisma.Controller.toggle('head');
        },
        down: function down() {
          Navigator.move('down');
        },
        right: function right() {
          if (Navigator.canmove('right')) Navigator.move('right');else filter.show(Prisma.Lang.translate('title_filter'), 'filter');
        },
        left: function left() {
          if (Navigator.canmove('left')) Navigator.move('left');else Prisma.Controller.toggle('menu');
        },
        back: this.back.bind(this)
      });
      Prisma.Controller.toggle('content');
    };
    this.render = function () {
      return files.render();
    };
    this.back = function () {
      Prisma.Activity.backward();
    };
    this.pause = function () {};
    this.stop = function () {};
    this.destroy = function () {
      network.clear();
      this.clearImages();
      files.destroy();
      scroll.destroy();
      clearInterval(balanser_timer);
      clearTimeout(life_wait_timer);
    };
  }

  function startPlugin() {
    window.online_plugin = true;
    var manifst = {
      type: 'video',
      version: '0.2.1',
      name: 'Смотреть онлайн',
      description: 'Нажмите для быстрого просмотра',
      component: 'online',
      onContextMenu: function onContextMenu(object) {
        return {
          name: Prisma.Lang.translate('online_watch'),
          description: ''
        };
      },
      onContextLauch: function onContextLauch(object) {
        resetTemplates();
        Prisma.Component.add('online', component);
        Prisma.Activity.push({
          url: '',
          title: Prisma.Lang.translate('title_online'),
          component: 'online',
          search: object.title,
          search_one: object.title,
          search_two: object.original_title,
          movie: object,
          page: 1
        });
      }
    };
    Prisma.Manifest.plugins = manifst;
    Prisma.Lang.add({
      online_watch: {
        //
        ru: 'Смотреть онлайн',
        en: 'Watch online',
        ua: 'Дивитися онлайн',
        zh: '在线观看'
      },
      online_video: {
        //
        ru: 'Видео',
        en: 'Video',
        ua: 'Відео',
        zh: '视频'
      },
      online_no_watch_history: {
        ru: 'Нет истории просмотра',
        en: 'No browsing history',
        ua: 'Немає історії перегляду',
        zh: '没有浏览历史'
      },
      online_nolink: {
        ru: 'Не удалось извлечь ссылку',
        uk: 'Неможливо отримати посилання',
        en: 'Failed to fetch link',
        zh: '获取链接失败'
      },
      online_balanser: {
        //
        ru: 'Источник',
        uk: 'Источник',
        en: 'Balancer',
        zh: '平衡器'
      },
      helper_online_file: {
        //
        ru: 'Удерживайте клавишу "ОК" на пульте, чтобы вызвать контекстное меню',
        uk: 'Утримуйте клавішу "ОК" для виклику контекстного меню',
        en: 'Hold the "OK" key to bring up the context menu',
        zh: '按住“确定”键调出上下文菜单'
      },
      title_online: {
        //
        ru: 'Смотреть',
        uk: 'Онлайн',
        en: 'Online',
        zh: '在线的'
      },
      online_voice_subscribe: {
        //
        ru: 'Подписаться на перевод',
        uk: 'Підписатися на переклад',
        en: 'Subscribe to translation',
        zh: '订阅翻译'
      },
      online_voice_success: {
        //
        ru: 'Вы успешно подписались',
        uk: 'Ви успішно підписалися',
        en: 'You have successfully subscribed',
        zh: '您已成功订阅'
      },
      online_voice_error: {
        //
        ru: 'Возникла ошибка',
        uk: 'Виникла помилка',
        en: 'An error has occurred',
        zh: '发生了错误'
      },
      online_clear_all_marks: {
        //
        ru: 'Очистить метки просмотра',
        uk: 'Очистити всі мітки',
        en: 'Clear all labels',
        zh: '清除所有标签'
      },
      online_clear_all_timecodes: {
        //
        ru: 'Очистить тайм-коды',
        uk: 'Очистити всі тайм-коди',
        en: 'Clear all timecodes',
        zh: '清除所有时间代码'
      },
      online_change_balanser: {
        //
        ru: 'Изменить источник',
        uk: 'Змінити источник',
        en: 'Change balancer',
        zh: '更改平衡器'
      },
      online_balanser_dont_work: {
        //
        ru: 'Источник ({balanser}) не отвечает (404). Идет работа на сервере.',
        uk: 'Источник ({balanser}) не відповідає на запит.',
        en: 'Balancer ({balanser}) does not respond to the request.',
        zh: '平衡器（{balanser}）未响应请求。'
      },
      online_balanser_timeout: {
        //
        ru: 'Источник будет переключен автоматически через <span class="timeout">10</span> секунд.',
        uk: 'Источник буде переключено автоматично через <span class="timeout">10</span> секунд.',
        en: 'Balancer will be switched automatically in <span class="timeout">10</span> seconds.',
        zh: '平衡器将在<span class="timeout">10</span>秒内自动切换。'
      },
      online_does_not_answer_text: {
        ru: 'Сервер не отвечает (404).',
        uk: 'Сервер не відповідає на запит.',
        en: 'Server does not respond to the request.',
        zh: '服务器未响应请求。'
      }
    });
    Prisma.Template.add('online_css', "\n    <style>\n    @charset 'UTF-8';.online-prestige{position:relative;-webkit-border-radius:.3em;border-radius:.3em;background-color:rgba(22,22,22,0.3);display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;will-change:transform}.online-prestige__body{padding:1.2em;line-height:1.3;-webkit-box-flex:1;-webkit-flex-grow:1;-ms-flex-positive:1;flex-grow:1;position:relative}@media screen and (max-width:480px){.online-prestige__body{padding:.8em 1.2em}}.online-prestige__img{position:relative;width:13em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0;min-height:10em}.online-prestige__img>img{position:absolute;top:0;left:0;width:100%;height:100%;-o-object-fit:cover;object-fit:cover;-webkit-border-radius:.3em;border-radius:.3em;opacity:0;-webkit-transition:opacity .3s;-o-transition:opacity .3s;transition:opacity .3s}.online-prestige__img--loaded>img{opacity:1}@media screen and (max-width:480px){.online-prestige__img{width:7em;min-height:6em}}.online-prestige__folder{padding:1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige__folder>svg{width:4.4em !important;height:4.4em !important}.online-prestige__viewed{position:absolute;top:1em;left:1em;background:rgba(0,0,0,0.45);-webkit-border-radius:100%;border-radius:100%;padding:.25em;font-size:.76em}.online-prestige__viewed>svg{width:1.5em !important;height:1.5em !important}.online-prestige__episode-number{position:absolute;top:0;left:0;right:0;bottom:0;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-box-pack:center;-webkit-justify-content:center;-ms-flex-pack:center;justify-content:center;font-size:2em}.online-prestige__loader{position:absolute;top:50%;left:50%;width:2em;height:2em;margin-left:-1em;margin-top:-1em;background:url(./img/loader.svg) no-repeat center center;-webkit-background-size:contain;-o-background-size:contain;background-size:contain}.online-prestige__head,.online-prestige__footer{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-pack:justify;-webkit-justify-content:space-between;-ms-flex-pack:justify;justify-content:space-between;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.online-prestige__timeline{margin:.8em 0}.online-prestige__timeline>.time-line{display:block !important}.online-prestige__title{font-size:1.4em;overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}@media screen and (max-width:480px){.online-prestige__title{font-size:1.2em}}.online-prestige__time{padding-left:2em}.online-prestige__info{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.online-prestige__info>*{overflow:hidden;-o-text-overflow:ellipsis;text-overflow:ellipsis;display:-webkit-box;-webkit-line-clamp:1;line-clamp:1;-webkit-box-orient:vertical}.online-prestige__quality{padding-left:1em;white-space:nowrap}.online-prestige__scan-file{position:absolute;bottom:0;left:0;right:0}.online-prestige__scan-file .broadcast__scan{margin:0}.online-prestige .online-prestige-split{font-size:.8em;margin:0 1em;-webkit-flex-shrink:0;-ms-flex-negative:0;flex-shrink:0}.online-prestige.focus{position:relative}.online-prestige.focus::after{content:'';position:absolute;top:-0.6em;left:-0.6em;right:-0.6em;bottom:-0.6em;-webkit-border-radius:.7em;border-radius:.7em;background:-webkit-gradient(linear,left top,right top,from(#176ae6),to(#5900ff));background:-webkit-linear-gradient(left,#176ae6,#5900ff);background:-o-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff);-webkit-box-shadow:0 10px 10px rgba(0,0,0,0.288);box-shadow:0 10px 10px rgba(0,0,0,0.288);z-index:-1;pointer-events:none;-webkit-animation:pulse 2s linear infinite;-o-animation:pulse 2s linear infinite;animation:pulse 2s linear infinite}@-webkit-keyframes pulse{0%{background:-webkit-gradient(linear,left top,right top,from(#176ae6),to(#5900ff));background:-webkit-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff)}50%{background:-webkit-gradient(linear,left top,right top,from(#5900ff),to(#176ae6));background:-webkit-linear-gradient(left,#5900ff,#176ae6);background:linear-gradient(to right,#5900ff,#176ae6)}100%{background:-webkit-gradient(linear,left top,right top,from(#176ae6),to(#5900ff));background:-webkit-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff)}}@-o-keyframes pulse{0%{background:-o-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff)}50%{background:-o-linear-gradient(left,#5900ff,#176ae6);background:linear-gradient(to right,#5900ff,#176ae6)}100%{background:-o-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff)}}@keyframes pulse{0%{background:-webkit-gradient(linear,left top,right top,from(#176ae6),to(#5900ff));background:-webkit-linear-gradient(left,#176ae6,#5900ff);background:-o-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff)}50%{background:-webkit-gradient(linear,left top,right top,from(#5900ff),to(#176ae6));background:-webkit-linear-gradient(left,#5900ff,#176ae6);background:-o-linear-gradient(left,#5900ff,#176ae6);background:linear-gradient(to right,#5900ff,#176ae6)}100%{background:-webkit-gradient(linear,left top,right top,from(#176ae6),to(#5900ff));background:-webkit-linear-gradient(left,#176ae6,#5900ff);background:-o-linear-gradient(left,#176ae6,#5900ff);background:linear-gradient(to right,#176ae6,#5900ff)}}.online-prestige+.online-prestige{margin-top:1.5em}.online-prestige--folder .online-prestige__footer{margin-top:.8em}.online-prestige-watched{padding:1em}.online-prestige-watched__icon>svg{width:1.5em;height:1.5em}.online-prestige-watched__body{padding-left:1em;padding-top:.1em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-flex-wrap:wrap;-ms-flex-wrap:wrap;flex-wrap:wrap}.online-prestige-watched__body>span+span::before{content:' ● ';vertical-align:top;display:inline-block;margin:0 .5em}.online-prestige-rate{display:-webkit-inline-box;display:-webkit-inline-flex;display:-ms-inline-flexbox;display:inline-flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center}.online-prestige-rate>svg{width:1.3em !important;height:1.3em !important}.online-prestige-rate>span{font-weight:600;font-size:1.1em;padding-left:.7em}.online-empty{line-height:1.4}.online-empty__title{font-size:1.8em;margin-bottom:.3em}.online-empty__time{font-size:1.2em;font-weight:300;margin-bottom:1.6em}.online-empty__buttons{display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex}.online-empty__buttons>*+*{margin-left:1em}.online-empty__button{background:rgba(0,0,0,0.3);font-size:1.2em;padding:.5em 1.2em;-webkit-border-radius:.2em;border-radius:.2em;margin-bottom:2.4em}.online-empty__button.focus{background:#fff;color:black}.online-empty__templates .online-empty-template:nth-child(2){opacity:.5}.online-empty__templates .online-empty-template:nth-child(3){opacity:.2}.online-empty-template{background-color:rgba(255,255,255,0.3);padding:1em;display:-webkit-box;display:-webkit-flex;display:-ms-flexbox;display:flex;-webkit-box-align:center;-webkit-align-items:center;-ms-flex-align:center;align-items:center;-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template>*{background:rgba(0,0,0,0.3);-webkit-border-radius:.3em;border-radius:.3em}.online-empty-template__ico{width:4em;height:4em;margin-right:2.4em}.online-empty-template__body{height:1.7em;width:70%}.online-empty-template+.online-empty-template{margin-top:1em}\n    </style>\n     ");
    $('body').append(Prisma.Template.get('online_css', {}, true));
    function resetTemplates() {
      Prisma.Template.add('online_prestige_full', " <div class=\"online-prestige online-prestige--full selector\">\n        <div class=\"online-prestige__img\">\n                <img alt=\"\">                \n                <div class=\"online-prestige__loader\"></div>\n                </div>            \n                <div class=\"online-prestige__body\">                \n                <div class=\"online-prestige__head\">                    \n                <div class=\"online-prestige__title\">{title}</div>                    \n                <div class=\"online-prestige__time\">{time}</div>                \n                </div>                \n                <div class=\"online-prestige__timeline\"></div>                \n                <div class=\"online-prestige__footer\">                    \n                <div class=\"online-prestige__info\">{info}</div>                    \n                <div class=\"online-prestige__quality\">{quality}</div>               \n                </div>\n                   </div>        \n                      </div>");
      Prisma.Template.add('online_content_loading', " <div class=\"online-empty\">            \n        <div class=\"broadcast__scan\">\n        <div>\n          </div>\n             </div>            \n         <div class=\"online-empty__templates\">                \n         <div class=\"online-empty-template selector\">                    \n         <div class=\"online-empty-template__ico\"></div>                    \n         <div class=\"online-empty-template__body\"></div>                \n             </div>                \n             <div class=\"online-empty-template\">                    \n             <div class=\"online-empty-template__ico\"></div>                    \n             <div class=\"online-empty-template__body\"></div>                \n                 </div>                \n                 <div class=\"online-empty-template\">                    \n                 <div class=\"online-empty-template__ico\"></div>                    \n                 <div class=\"online-empty-template__body\"></div>                \n                    </div>            \n                       </div>        \n                          </div>");
      Prisma.Template.add('online_does_not_answer', " <div class=\"online-empty\">            \n        <div class=\"online-empty__title\">#{online_balanser_dont_work}</div>            \n        <div class=\"online-empty__time\">#{online_balanser_timeout}</div>            \n        <div class=\"online-empty__buttons\">\n        <div class=\"online-empty__button selector cancel\">#{cancel}</div>\n        <div class=\"online-empty__button selector change\">#{online_change_balanser}</div>\n              </div>\n              <div class=\"online-empty__templates\">\n              <div class=\"online-empty-template\">\n              <div class=\"online-empty-template__ico\"></div>\n              <div class=\"online-empty-template__body\"></div>\n                   </div>\n                     <div class=\"online-empty-template\"><div class=\"online-empty-template__ico\"></div>\n                     <div class=\"online-empty-template__body\"></div>\n                         </div>               \n                             <div class=\"online-empty-template\">\n                             <div class=\"online-empty-template__ico\"></div>\n                             <div class=\"online-empty-template__body\"></div>\n                                </div>\n                                   </div>\n                                      </div>");
      Prisma.Template.add('online_prestige_rate', " \n        <div class=\"online-prestige-rate\">\n        <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\">\n<path d=\"M12 15C15.7279 15 18.75 12.0899 18.75 8.5C18.75 4.91015 15.7279 2 12 2C8.27208 2 5.25 4.91015 5.25 8.5C5.25 12.0899 8.27208 15 12 15Z\" stroke=\"#292D32\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n<path d=\"M7.51999 13.52L7.51001 20.9C7.51001 21.8 8.14001 22.24 8.92001 21.87L11.6 20.6C11.82 20.49 12.19 20.49 12.41 20.6L15.1 21.87C15.87 22.23 16.51 21.8 16.51 20.9V13.34\" stroke=\"#292D32\" stroke-width=\"1.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"/>\n</svg>\n        <span>{rate}</span>\n            </div>");
      Prisma.Template.add('online_prestige_folder', "\n        <div class=\"online-prestige online-prestige--folder selector\">\n        <div class=\"online-prestige__folder\">\n        <svg viewBox=\"0 0 128 112\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><rect y=\"20\" width=\"128\" height=\"92\" rx=\"13\" fill=\"white\"></rect>\n        <path d=\"M29.9963 8H98.0037C96.0446 3.3021 91.4079 0 86 0H42C36.5921 0 31.9555 3.3021 29.9963 8Z\" fill=\"white\" fill-opacity=\"0.23\"></path><rect x=\"11\" y=\"8\" width=\"106\" height=\"76\" rx=\"13\" fill=\"white\" fill-opacity=\"0.51\"></rect></svg>\n            </div>\n               <div class=\"online-prestige__body\"> \n               <div class=\"online-prestige__head\">\n               <div class=\"online-prestige__title\">{title}</div>\n               <div class=\"online-prestige__time\">{time}</div>\n                   </div>\n                      <div class=\"online-prestige__footer\">\n                      <div class=\"online-prestige__info\">{info}</div>\n                         </div>\n                            </div>\n                               </div>");
      Prisma.Template.add('online_prestige_watched', " <!-- <div class=\"online-prestige online-prestige-watched selector\">\n        <div class=\"online-prestige-watched__icon\">\n        <svg width=\"21\" height=\"21\" viewBox=\"0 0 21 21\" fill=\"none\" xmlns=\"http://www.w3.org/2000/svg\"><circle cx=\"10.5\" cy=\"10.5\" r=\"9\" stroke=\"currentColor\" stroke-width=\"3\"/><path d=\"M14.8477 10.5628L8.20312 14.399L8.20313 6.72656L14.8477 10.5628Z\" fill=\"currentColor\"/></svg>\n            </div>\n                <div class=\"online-prestige-watched__body\">\n                    </div>\n                       </div> -->");
    }
    var button = "<div class=\"full-start__button selector view--online\" data-subtitle=\"Prestige v".concat(manifst.version, "\">\n    <svg width=\"24\" height=\"24\" viewBox=\"0 0 24 24\" xmlns=\"http://www.w3.org/2000/svg\">\n    <path d=\"M4 6.13352V17.8681C4 20.2714 6.54234 21.7796 8.57143 20.578L13.5248 17.6474L18.4782 14.7045C20.5073 13.5029 20.5073 10.4987 18.4782 9.29708L13.5248 6.35424L8.57143 3.42366C6.54234 2.222 4 3.71794 4 6.13352Z\" fill=\"white\"></path>\n    </svg>\n\n        <span>#{title_online}</span>\n    </div>");
    Prisma.Component.add('online', component); //то же самое
    resetTemplates();
    function addButton(e) {
      if (e.render.find('.online--button').length) return;
      var btn = $(Prisma.Lang.translate(button));
      btn.on('hover:enter', function () {
        resetTemplates();
        Prisma.Component.add('online', component);
        Prisma.Activity.push({
          url: '',
          title: Prisma.Lang.translate('title_online'),
          component: 'online',
          search: e.movie.title,
          search_one: e.movie.title,
          search_two: e.movie.original_title,
          movie: e.movie,
          page: 1
        });
      });
      e.render.after(btn);
    }
    Prisma.Listener.follow('full', function (e) {
      if (e.type == 'complite') {
        addButton({
          render: e.object.activity.render().find('.view--torrent'),
          movie: e.data.movie
        });
      }
    });
    try {
      if (Prisma.Activity.active().component == 'full') {
        addButton({
          render: Prisma.Activity.active().activity.render().find('.view--torrent'),
          movie: Prisma.Activity.active().card
        });
      }
    } catch (e) {}
    if (Prisma.Manifest.app_digital >= 177) {
      Prisma.Storage.sync('online_watched_last', 'object_object');
    }
  }
  if (!window.online_plugin) startPlugin();

})();
