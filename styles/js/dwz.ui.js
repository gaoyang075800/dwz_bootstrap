/**
 * Created by huihuazhang on 14-10-10.
 */
(function($){

	$(function(){
		var $doc = $(document).ajaxStart(function(){
			DWZ.globalLoging.show();
		}).ajaxStop(function(){
			DWZ.globalLoging.hide();
		});

		setTimeout(function(){
			$(document).initUI();

			// 清除模态窗口缓存
			$("#"+DWZ.conf.dialogId).on("hidden.bs.modal",function(event){
				$(this).removeData('bs.modal').find('.modal-content').html('');
			}).on("loaded.bs.modal",function(event){
				$(event.target).initUI();
			});
			$doc.bind(DWZ.eventType.dialogAjaxSuccess, function(event, json){
				if(!json.forwardUrl) { $("#"+DWZ.conf.dialogId).modal('hide'); }
			});

			// Ajax加载时浏览器支持前进、后退、刷新定位
			if ($.History) $.History.init({containerId:DWZ.conf.containerId, homeHash:'index'});

		}, 10);
	});

	function _iframeResponse(iframe, callback){
		var $iframe = $(iframe), $document = $(document);

		$document.trigger("ajaxStart");

		$iframe.bind("load", function(event){
			$iframe.unbind("load");
			$document.trigger("ajaxStop");

			if (iframe.src == "javascript:'%3Chtml%3E%3C/html%3E';" || // For Safari
				iframe.src == "javascript:'<html></html>';") { // For FF, IE
				return;
			}

			var doc = iframe.contentDocument || iframe.document;

			// fixing Opera 9.26,10.00
			if (doc.readyState && doc.readyState != 'complete') return;
			// fixing Opera 9.64
			if (doc.body && doc.body.innerHTML == "false") return;

			var response;

			if (doc.XMLDocument) {
				// response is a xml document Internet Explorer property
				response = doc.XMLDocument;
			} else if (doc.body){
				try{
					response = $iframe.contents().find("body").text();
					response = jQuery.parseJSON(response);
				} catch (e){ // response is html document or plain text
					response = doc.body.innerHTML;
				}
			} else {
				// response is a xml document
				response = doc;
			}

			callback(response);
		});
	}

	function _formValidate($p){
		$("form.required-validate", $p).each(function(){
			var $form = $(this).bind(DWZ.eventType.ajaxDone, function(event, json){
				if (json[DWZ.keys.statusCode] == DWZ.statusCode.ok){
					// pagerForm
					if (DWZ.dwzPageBreak) DWZ.dwzPageBreak({rel: json.dialog ? '' : DWZ.conf.containerId }, event);
				}
			});
			var form = $form[0];

			$form.validator({
				errors: {
					minlength: '长度不够'
				}
			}).on('submit', function (event) {
				if (event.isDefaultPrevented()) {
					// handle the invalid form...
					var message = DWZ.msg("validateFormError", [$form.find('.has-error').size()]);
					DWZ.alert.error(message);
				} else {
					// everything looks good!
					DWZ.alert.close();

					if ($form.find(':file').size() == 0) { // ajax表单异步提交

						$.ajax({
							type: form.method || 'POST',
							url:$form.attr("action"),
							data:$form.serializeArray(),
							dataType:"json",
							cache: false,
							success: function(json){
								DWZ.ajaxDone(json, event);

							},
							error: DWZ.ajaxError
						});

					} else { // 含文件上传的表单，使用iframe模拟异步提交
						var $iframe = $("#callbackframe");
						if ($iframe.size() == 0) {
							$iframe = $("<iframe id='callbackframe' name='callbackframe' src='about:blank' style='display:none'></iframe>").appendTo("body");
						}

						var url = $form.attr('action');
						if (url && url.indexOf('ajax=1')==-1){
							url = url + (url.indexOf('?')==-1 ? '?ajax=1' : '&ajax=1');
							$form.attr('action', url);
						}

						form.target = "callbackframe";

						$form.attr('enctype', 'multipart/form-data');

						_iframeResponse($iframe[0], function(json){
							DWZ.ajaxDone(json, event);
						});
						form.submit();
					}

					DWZ.globalLoging.show();
				}

				return false;
			});

		});
	}

	// 自动追加到DWZ.initUI()
	DWZ.regPlugins.push(function($p){
		//validate form
		if ($.fn.validator) _formValidate($p);

		$('button[data-loading-text], a[data-loading-text]').on('click', function () {
			window.currentLoadingBtn = $(this);
		});

		// Ajax链接, 支持浏览器前进、后退、刷新时，根据hash定位
		$("a[data-history]", $p).each(function(){
			var $this = $(this);
			var url = $this.attr('href'),
				hash = url;

			if ($.History) $.History.addHistory(hash, url);

			$(this).click(function(event){
				var current_hash = location.hash.skipChar('#').replace(/\?.*$/, '');
				var rel = $this.attr('data-ajax') || DWZ.conf.containerId;
				if ($.History && current_hash != hash) {
					$.History.loadHistory(hash);
				} else {
					$('#'+rel).loadUrl(url);
				}

				event.preventDefault();
			});
		});

		// Ajax链接
		$("a[data-ajax]", $p).each(function(){
			$(this).click(function(event){
				var $this = $(this);
				var rel = $this.attr('data-ajax') || DWZ.conf.containerId;
				var url = unescape($this.attr("href")).replaceTmById($(event.target).unitBox());
				DWZ.debug(url);
				if (!url.isFinishedTm()) {
					DWZ.alert.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
					return false;
				}

				if ($this.attr('data-loading-text')) {
					$this.button('loading');
					$("#"+rel).ajaxUrl({url:url, data:{}, completeFn:function(){
						$this.button('reset');
					}});
				} else {
					$("#"+rel).loadUrl(url);
				}

				event.preventDefault();
			});
		});

		if ($.fn.pagination) {
			$("div.pagination", $p).each(function(){
				var $this = $(this);
				$this.pagination({
					rel:$this.attr("rel") || DWZ.conf.containerId,
					totalCount:$this.attr("totalCount"),
					numPerPage:$this.attr("numPerPage"),
					pageNumShown:$this.attr("pageNumShown"),
					currentPage:$this.attr("currentPage")
				});
			});
		}
		if ($.fn.pagerForm) $("form[rel=pagerForm]", $p).pagerForm({parentBox:$p});

		if ($.fn.tableDB) $('table.table', $p).tableDB();
		if ($.fn.ajaxTodo) $("a[data-todo=ajaxTodo]", $p).ajaxTodo();
		if ($.fn.dwzExport) $("a[data-todo=dwzExport]", $p).dwzExport();
		if ($.fn.selectRef) $("select[data-ref]", $p).selectRef();

		if ($.fn.xheditor){
			$("textarea.editor", $p).each(function(){
				var $this = $(this);
				var op = {html5Upload:false, skin: 'vista',tools: $this.attr("data-tools") || 'full'};
				var upAttrs = [
					["upLinkUrl","upLinkExt","zip,rar,txt"],
					["upImgUrl","upImgExt","jpg,jpeg,gif,png"],
					["upFlashUrl","upFlashExt","swf"],
					["upMediaUrl","upMediaExt","avi"]
				];

				$(upAttrs).each(function(i){
					var urlAttr = upAttrs[i][0];
					var extAttr = upAttrs[i][1];

					if ($this.attr(urlAttr)) {
						op[urlAttr] = $this.attr(urlAttr);
						op[extAttr] = $this.attr(extAttr) || upAttrs[i][2];
					}
				});
				$this.css('height', '200px');
				$this.xheditor(op);
			});
		}

		/**
		 * http://www.bootcss.com/p/bootstrap-datetimepicker/
		 *
		 * <input class="date form_datetime" type="text" value="2012-05-15 21:05" data-date-format="yyyy-mm-dd hh:ii">
		 *
		 * <div class="input-append date form_date" data-date="12-02-2012" data-date-format="dd-mm-yyyy">
		 *     <input size="16" type="text" value="12-02-2012" readonly>
		 *      <span class="input-group-addon"><span class="glyphicon glyphicon-remove"></span></span>
		 *		<span class="input-group-addon"><span class="glyphicon glyphicon-calendar"></span></span>
		 * </div>
		 */
		if ($.fn.datetimepicker) {
			$('.form_datetime', $p).datetimepicker({
				weekStart: 1,
				todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				forceParse: 0,
				showMeridian: 1
			});
			$('.form_date', $p).datetimepicker({
				weekStart: 1,
				todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 2,
				minView: 2,
				forceParse: 0
			});
			$('.form_time', $p).datetimepicker({
				weekStart: 1,
				todayBtn:  1,
				autoclose: 1,
				todayHighlight: 1,
				startView: 1,
				minView: 0,
				maxView: 1,
				forceParse: 0
			});
		}
	});


	$.fn.extend({
		tableDB: function(){

			return this.each(function(){
				var $this = $(this);
				var $trs = $this.find('tbody>tr');
				var $grid = $this.parent(); // table

				$trs.each(function(index){
					var $tr = $(this);

					$tr.click(function(){
						$trs.filter(".selected").removeClass("selected");
						$tr.addClass("selected");
						var sTarget = $tr.attr("data-target");
						if (sTarget) {
							if ($("#"+sTarget, $grid).size() == 0) {
								$grid.prepend('<input id="'+sTarget+'" type="hidden" />');
							}
							$("#"+sTarget, $grid).val($tr.attr("data-value"));
						}
					});

				});

				$this.find("thead [orderField]").orderBy({
					targetType: $this.attr("targetType"),
					rel:$this.attr("rel"),
					asc: $this.attr("asc") || "asc",
					desc:  $this.attr("desc") || "desc"
				});
			});
		},

		ajaxTodo:function(){
			return this.each(function(){
				var $this = $(this);
				$this.click(function(event){
					var url = unescape($this.attr("href")).replaceTmById($(event.target).unitBox());
					DWZ.debug(url);
					if (!url.isFinishedTm()) {
						DWZ.alert.error($this.attr("warn") || DWZ.msg("alertSelectMsg"));
						return false;
					}
					var title = $this.attr("title");
					if (title) {
						if (confirm(title)) {
							DWZ.ajaxTodo(url, event);
						}
					} else {
						DWZ.ajaxTodo(url, event);
					}
					event.preventDefault();
				});

				setTimeout(function(){
					if (!$this.isBind(DWZ.eventType.ajaxDone)) {
						$this.bind(DWZ.eventType.ajaxDone, function(event, json){
							if (json[DWZ.keys.statusCode] == DWZ.statusCode.ok){
								// pagerForm
								if (DWZ.dwzPageBreak && !json.forwardUrl) DWZ.dwzPageBreak({rel:json.rel || DWZ.conf.containerId}, event);
							}
						});
					}
				}, 20);

			});
		},
		dwzExport: function(){
			function _doExport($this) {
				var $p = $this.unitBox();
				var $form = $("#pagerForm", $p);
				var url = $this.attr("href");
				window.location = url+(url.indexOf('?') == -1 ? "?" : "&")+$form.serialize();
			}

			return this.each(function(){
				var $this = $(this);
				$this.click(function(event){
					var title = $this.attr("title");
					if (title) {
						if (confirm(title)) {
							_doExport($this);
						}
					} else {_doExport($this);}

					event.preventDefault();
				});
			});
		}
	});

})(jQuery);