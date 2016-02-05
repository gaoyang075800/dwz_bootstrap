/**
 * @author z@j-ui.com
 */
(function($){

	var _onchange = function (event){
		var $ref = $("#"+event.data.ref);
		if ($ref.size() == 0) return false;

		$.ajax({
			type:'POST', dataType:"json", url:event.data.refUrl.replace("{value}", encodeURIComponent(event.data.$this.val() || '')), cache: false,
			data:{},
			success: function(json){
				if (!json) return;
				var html = '';

				$.each(json, function(i){
					if (json[i] && json[i].length > 1){
						html += '<option value="'+json[i][0]+'">' + json[i][1] + '</option>';
					}
				});

				$ref.html(html);
				$ref.trigger("change").selectRef();
			},
			error: DWZ.ajaxError
		});
	};
					
	$.extend($.fn, {
		selectRef:function(){

			return this.each(function(i){
				var $this = $(this),
					ref = $this.attr("data-ref"),
					refUrl = $this.attr('data-ref-url') || '';

				if (ref && refUrl) {
					$this.unbind("change", _onchange).bind("change", {ref:ref, refUrl:refUrl, $this:$this}, _onchange);
				}
				
			});
		}
	});
})(jQuery);
