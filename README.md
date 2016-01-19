# DWZ ＋ Bootstrap 整合应用（dwz for bootstrap v1.0.0）

<pre>
bootstrap + dwz 表单验证，ajax表单提交，在文件上传的表单异步提交，错误提示
表单如果很长，有错误提示时，会自动滚动到页面头部，方便看出错信息
使用的时候只要在form上加一个class="required-validate" 就可以自动判断是 ajax提交还是, 文件上传提交，会自动处理

ajax表单可以写自定义事件
ajaxDone 这是是定义好的自定义事件，表单提交完成时自动触发的。
支持绑定自定义ajaxDone事件，dwz.ajaxDone事件绑定一个函数，这个函数开发人员自己定义比较灵活：
$('xxxForm').bind(DWZ.eventType.ajaxDone, function(json) {
  ...
})
</pre>