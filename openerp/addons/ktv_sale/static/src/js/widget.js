//widget定义
//erp_instance openerp的客户端实例对象，在boot.js中初始化
openerp.ktv_sale.widget = function(erp_instance) {
	//引用model和helper
	var model = erp_instance.ktv_sale.model;
	var helper = erp_instance.ktv_sale.helper;
	//扩展通用的模板方法
	var QWeb = erp_instance.web.qweb;
	var qweb_template = function(template) {
		return function(ctx) {
			return QWeb.render(template, _.extend({},
			ctx, {
				//以下定义需要在界面上显示的数据
				'all_rooms': erp_instance.ktv_sale.ktv_room_point.get('all_rooms').toJSON(),
				'display_rooms': erp_instance.ktv_sale.ktv_room_point.get('display_rooms').toJSON(),
				'room_types': erp_instance.ktv_sale.ktv_room_point.get('room_types').toJSON(),
				'room_areas': erp_instance.ktv_sale.ktv_room_point.get('room_areas').toJSON(),
				'fee_types': erp_instance.ktv_sale.ktv_room_point.get('fee_types').toJSON(),
				'price_classes': erp_instance.ktv_sale.ktv_room_point.get('price_classes').toJSON(),
				'member_classes': erp_instance.ktv_sale.ktv_room_point.get('member_classes').toJSON(),
				'pay_types': erp_instance.ktv_sale.ktv_room_point.get('pay_types').toJSON(),
				'currency': erp_instance.ktv_sale.ktv_room_point.get('currency'),
				'format_amount': function(amount) {
					if (erp_instance.ktv_sale.ktv_room_point.get('currency').position == 'after') {
						return amount + ' ' + erp_instance.ktv_sale.ktv_room_point.get('currency').symbol;
					} else {
						return erp_instance.ktv_sale.ktv_room_point.get('currency').symbol + ' ' + amount;
					}
				},
			}));
		};
	};
	var _t = erp_instance.web._t;

	var widget = erp_instance.ktv_sale.widget = {};
	//定义基于bootstrap的modal的dialog类
	widget.BootstrapModal = erp_instance.web.OldWidget.extend(
	/** @lends openerp.web.Dialog# */
	{
		/**
     * @constructs openerp.web.Dialog
     * @extends openerp.web.OldWidget
     *
     * @param parent
     * @param options
     */
		init: function(parent, options) {
			var self = this;
			this._super(parent);
			this.dialog_options = {
				width: 'auto',
				backdrop: 'static',
				keyboard: true,
				show: true,
				remote: false
			};
			if (options) {
				_.extend(this.dialog_options, options);
			}
			if (this.dialog_options.show) this.open();

		},
		open: function(options) {
			var self = this;
			this.appendTo($('body'));
			this.$element.find(".modal").modal(self.dialog_options).on('hidden', _.bind(self.stop, self)).modal('show').css({
				width: self.dialog_options.width,
				'margin-left': function() {
					return - ($(this).width() / 2);
				}
			}).on("shown",_.bind(this.post_open,this));
			return this;
		},
        //打开后的处理,用于焦点设置等等
        post_open : function() {},
		close: function() {
			this.$element.find(".modal").modal('hide');
		},
		stop: function() {
			// Destroy widget
			this.close();
			this._super();
		}
	});
	//roomWidget
	widget.RoomWidget = erp_instance.web.OldWidget.extend({
		tag_name: 'li',
		template_fct: qweb_template('room-template'),
		init: function(parent, options) {
			this._super(parent);
			this.model = options.model;
		},
		start: function() {
			this.model.bind('change', _.bind(this.render_element, this));
			this.$element.click(_.bind(this.on_click, this));
			//预定事件
			this.$element.find(".action_room_scheduled").click(_.bind(this.action_room_scheduled, this));
			this.$element.find(".action_room_opens").click(_.bind(this.action_room_opens, this));
			this.$element.find(".action_room_buyout").click(_.bind(this.action_room_buyout, this));
		},
		//包厢预定
		action_room_scheduled: function() {
			var win = new widget.RoomScheduledWidget(null, {
				room: this.model,
			});
			$('#operate_area').html(win.$element);
			win.render_element();
			win.start();
		},
		//开房
		action_room_opens: function() {
			var r = new widget.RoomOpensWidget(null, {
				room: this.model
			});
			$('#operate_area').html(r.$element);
			r.render_element();
			r.start();
		},
		//买断
		action_room_buyout: function() {
			var r = new widget.RoomBuyoutWidget(null, {
				room: this.model
			});
			r.ready.then(function() {
				$('#operate_area').html(r.$element);
				r.render_element();
				r.start();
			});
		},
		//当前包厢点击事件
		on_click: function() {
			erp_instance.ktv_sale.ktv_room_point.set({
				"current_room": this.model
			});
		},
		render_element: function() {
			this.$element.empty();
			this.$element.html(this.template_fct(this.model.export_as_json()));
		}
	});
	//房间列表
	widget.RoomListWidget = erp_instance.web.OldWidget.extend({
		init: function(parent, options) {
			this._super(parent);
			erp_instance.ktv_sale.ktv_room_point.get('display_rooms').bind('reset', this.render_element, this);
		},
		render_element: function() {
			this.$element.empty();
			erp_instance.ktv_sale.ktv_room_point.get('display_rooms').each(_.bind(function(r) {
				var r_widget = new widget.RoomWidget(null, {
					model: r
				});
				r_widget.appendTo(this.$element);
			},
			this), this);
			return this;
		}
	});
	//房态统计
	//RoomStatusWidget
	widget.RoomStatusWidget = erp_instance.web.OldWidget.extend({
		template_fct: qweb_template('room-status-template'),
		init: function(parent, options) {
			this._super(parent);
		},
		start: function() {
			//ktv_shop中的包厢数据发生变化时,重绘房态组件
			erp_instance.ktv_sale.ktv_room_point.bind('change:room_status', this.render_element, this);
		},
		render_element: function() {
			this.$element.empty();
			this.$element.html(this.template_fct(erp_instance.ktv_sale.ktv_room_point.get('room_status')));
			return this;
		}
	});

	//包厢过滤 widget
	widget.RoomFilterWidget = erp_instance.web.OldWidget.extend({
		template_fct: qweb_template('room-filter'),
		init: function(parent, options) {
			this._super(parent);
		},
		start: function() {
			//绑定按钮点击事件
			$('.btn-room-type-filter,.btn-room-area-filter,.btn-room-state-filter').click(_.bind(this._filter_room, this));
		},
		//根据前端的操作过滤包厢的显示
		_filter_room: function(evt) {
			var click_btn = $(evt.target);
			var btn_class = "";
			if (click_btn.hasClass('btn-room-type-filter')) btn_class = ".btn-room-type-filter";
			if (click_btn.hasClass('btn-room-state-filter')) btn_class = ".btn-room-state-filter";
			if (click_btn.hasClass('btn-room-area-filter')) btn_class = ".btn-room-area-filter";

			$(btn_class).removeClass('active')
			if (!click_btn.hasClass('active')) click_btn.addClass('active');
			var room_state = $('.btn-room-state-filter').filter('.active').data('room-state');
			var room_area_id = $('.btn-room-area-filter').filter('.active').data('room-area-id');
			var room_type_id = $('.btn-room-type-filter').filter('.active').data('room-type-id');
			//所有房间
			var rooms = erp_instance.ktv_sale.ktv_room_point.get('all_rooms').toJSON();
			var filtered_rooms = rooms;
			if (room_state != - 1) filtered_rooms = _.filter(rooms, function(r) {
				return r.state == room_state;
			});
			if (room_type_id != - 1) filtered_rooms = _.filter(filtered_rooms, function(r) {
				return r.room_type_id[0] == room_type_id;
			});
			if (room_area_id != - 1) filtered_rooms = _.filter(filtered_rooms, function(r) {
				return r.room_area_id[0] == room_area_id;
			});
			erp_instance.ktv_sale.ktv_room_point.get('display_rooms').reset(filtered_rooms);
		},

		render_element: function() {
			this.$element.html(this.template_fct({}));
			return this;
		}
	});

	//KtvRoomPointWidget
	widget.KtvRoomPointWidget = erp_instance.web.OldWidget.extend({
		init: function(parent, options) {
			this._super(parent);
		},
		start: function() {
			this.room_list_view = new widget.RoomListWidget();
			this.room_list_view.$element = $('#room_list');
			this.room_list_view.render_element();
			this.room_list_view.start();

			this.room_status_view = new erp_instance.ktv_sale.widget.RoomStatusWidget();
			this.room_status_view.$element = $('#room_status');
			this.room_status_view.render_element();
			this.room_status_view.start();

			//room filter
			this.room_filter_view = new erp_instance.ktv_sale.widget.RoomFilterWidget();
			this.room_filter_view.$element = $('#room_filter');
			this.room_filter_view.render_element();
			this.room_filter_view.start();

			//room info
			this.room_info_tab_view = new widget.RoomInfoWidget();
			this.room_info_tab_view.$element = $('#room_info_tab');
			this.room_info_tab_view.render_element();
			this.room_info_tab_view.start();
		}
	});

	//右侧显示的包厢信息对象
	widget.RoomInfoWidget = erp_instance.web.OldWidget.extend({
		template_fct: qweb_template('room-info-wrapper-template'),
		init: function(parent, options) {
			this._super(parent);
			erp_instance.ktv_sale.ktv_room_point.bind("change:current_room", this.render_element, this);
		},
		start: function() {},
		set_display_by_fee_type: function() {
			var self = this;
			//需要根据计费方式不同显示不同的费用信息
			var cur_room = erp_instance.ktv_sale.ktv_room_point.get("current_room");
			if (!cur_room) return false;

			var fee_type_id = cur_room.get("fee_type_id")[0];
			new erp_instance.web.Model("ktv.fee_type").get_func("read")(fee_type_id, ['id', 'fee_type_code', 'name']).pipe(function(fee_type) {

				self.$element.find(".room_fee,.minimum_fee,.minimum_fee_p,.buyout_fieldset,.buffet_fieldset,.buyout_config_lines,.buffet_config_lines,.buytime_fieldset,.hourly_fee_promotion_lines,.hourly_fee_lines,.member_hourly_fee_lines,.hourly_fee_p_lines").hide();
				//只收包厢费
				if (fee_type.fee_type_code == "only_room_fee") {
					self.$element.find(".room_fee").show();
				}
				//只收钟点费
				if (fee_type.fee_type_code == "only_hourly_fee") {
					self.$element.find(".hourly_fee,.hourly_fee_lines,.buytime_fieldset,.hourly_fee_promotion_lines").show();
				}

				//钟点费+包厢费
				if (fee_type.fee_type_code == "room_fee_plus_hourly_fee") {
					self.$element.find(".room_fee,.hourly_fee,.hourly_fee_lines,.buytime_fieldset,.hourly_fee_promotion_lines").show();
				}
				//最低消费
				if (fee_type.fee_type_code == "minimum_fee") {
					self.$element.find(".minimum_fee,.buytime_fieldset,.hourly_fee_promotion_lines").show();
				}

				//包厢费+最低消费
				if (fee_type.fee_type_code == "room_fee_plus_minimum_fee") {
					self.$element.find(".room_fee,.minimum_fee,.buytime_fieldset").show();
				}

				//钟点费+最低消费
				if (fee_type.fee_type_code == "hourly_fee_plus_minimum_fee") {
					self.$element.find(".hourly_fee_lines,.minimum_fee,.buytime_fieldset,.hourly_fee_promotion_lines").show();
				}

				//包厢费+钟点费+最低消费
				if (fee_type.fee_type_code == "room_fee_plus_hourly_fee_plus_minimum_fee") {
					self.$element.find(".room_fee,.hourly_fee,.hourly_fee_lines,.minimum_fee,.buytime_fieldset,.hourly_fee_promotion_lines").show();
				}
				//按位钟点费
				if (fee_type.fee_type_code == "hourly_fee_p") {
					self.$element.find(".hourly_fee_p_lines,.buytime_fieldset,.hourly_fee_promotion_lines").show();
				}

				//按位最低消费
				if (fee_type.fee_type_code == "minimum_fee_p") {
					self.$element.find(".minimum_fee_p").show();
				}
				//买断
				if (fee_type.fee_type_code == "buyout_fee") {
					self.$element.find(".buyout_config_lines,.buyout_fieldset").show();
					self.$element.find(".buytime_fieldset").hide();
				}
				//自助餐
				if (fee_type.fee_type_code == "buffet") {
					self.$element.find(".buffet_config_lines,.buffet_fieldset").show();
					self.$element.find(".buytime_fieldset").hide();
				}
			});
		},
		render_element: function() {
			var self = this;
			var the_room = erp_instance.ktv_sale.ktv_room_point.get("current_room");
			var the_room_fee_info = the_room.get_room_fee_info();
			the_room_fee_info.ready.then(function() {
				self.$element.html(self.template_fct({
					"room_info": the_room.export_as_json(),
					"room_fee_info": the_room_fee_info.export_as_json()
				}));
				self.set_display_by_fee_type();
			});
			return this;
		}
	});

	//预定widget
	widget.RoomScheduledWidget = erp_instance.web.OldWidget.extend({
		template_fct: qweb_template('room-scheduled-form-template'),
		init: function(parent, options) {
			this.room = options.room;
			this.model = new erp_instance.ktv_sale.model.RoomScheduled({
				room_id: this.room.get("id")
			});
			this._super(parent, options);
		},
		start: function() {
			//隐藏其他元素
			$('#room_status').hide();
			$('#room_filter').hide();
			$('#room_list').hide();

			this.$element.find('.btn-close-room-scheduled').click(_.bind(this.close, this));

			this.$form = $(this.$element).find("#room_scheduled_form");
			this.$form.find('#scheduled_time').datetimepicker();
			this.$form.find('#scheduled_time').val(this.model.get('scheculed_time'));
			//包厢改变事件
			this.$form.find("#room_id").change(_.bind(this.on_change_room, this));
			//设置初始值
			if (this.room) this.$form.find('#room_id').val(this.room.id);
			//保存事件
			this.$element.find(".btn-save").click(_.bind(this.save, this));
			return this;
		},
        close: function() {
			$('#room_status').show();
			$('#room_filter').show();
			$('#room_list').show();
			this.stop();
		},

		render_element: function() {
			this.$element.html(this.template_fct({
				rooms: erp_instance.ktv_sale.ktv_room_point.get_rooms_by_state('free').toJSON(),
				model: this.model.toJSON()
			}));
			return this;
		},
		//修改包厢
		on_change_room: function() {
			var changed_room = erp_instance.ktv_sale.ktv_room_point.get("all_rooms").get(this.$form.find('#room_id').val());
			this.room = changed_room;
			this.model.set({
				"room_id": changed_room.get("id")
			});
		},
		//验证录入数据是否有效
		validate: function() {
			return this.$form.validate().form();
		},
		//保存预定信息
		save: function() {
			var self = this;
			if (!this.validate()) {
				return false;
			}
			//自界面获取各项值
			this.model.set(this.$form.form2json());
			var scheduled_time = this.$form.find("#scheduled_time").val();

			//var f_scheduled_time =  erp_instance.web.format_value(scheduled_time, {"widget": "datetime"});
			this.model.set({
				"scheduled_time": scheduled_time
			});
			this.model.push().pipe(function(result) {
				//更新包厢状态
				self.room.set(result);
				self.close();
			});
		}
	});

	//RoomOpensWidget 开房widget
	widget.RoomOpensWidget = erp_instance.web.OldWidget.extend({
		template_fct: qweb_template("room-opens-template"),
		init: function(parent, options) {
			//当前包厢
			this.room = options.room;
			this.model = new model.RoomOpens();
			this.member = new model.Member();
			this.member.bind("change", this.render_member_card_no, this);
			this._super(parent, options);
		},
		start: function() {
			//隐藏其他元素
			$('#room_status').hide();
			$('#room_filter').hide();
			$('#room_list').hide();
			this.$element.find('.btn-close-room-opens').click(_.bind(this.close, this));
			//会员卡扫描
			this.$element.find('.btn-member-card-read').click(_.bind(this.open_member_card_read_win, this));
			this.$element.find('.btn-member-card-clear').click(_.bind(this.clear_member_card, this));
			//绑定相关事件
			this.$form = this.$element.find("#room_opens_form");
			this.$form.find("#room_id").change(_.bind(this.on_change_room, this));
			this.$form.find("#room_id").val(this.room.get("id"));
			this.$element.find(".btn-save-room-opens").click(_.bind(this.save, this));
		},
		close: function() {
			$('#room_status').show();
			$('#room_filter').show();
			$('#room_list').show();
			this.stop();
		},
		//打开会员卡读取窗口
		open_member_card_read_win: function() {
			var m_win = new widget.MemberCardReadWidget(null, {
				show: false,
				model: this.member
			});
			m_win.open();
		},
		//清楚会员信息
		clear_member_card: function() {
			this.member.clear();
		},
		//重新显示会员信息
		render_member_card_no: function() {
			if (this.member.get("id")) {
				var member_card_no = this.member.get("member_card_no");
				var member_class = this.member.get("member_class_id");
				var member_name = this.member.get("name");
				var info = member_card_no + "[" + member_class[1] + "]" + "[" + member_name + "]" ;
				this.$element.find("#member_card_no").html(info);
			}
            else
				this.$element.find("#member_card_no").html(null);
		},

		render_element: function() {
			this.$element.html(this.template_fct({
				rooms: erp_instance.ktv_sale.ktv_room_point.get_rooms_by_state('free').toJSON(),
				model: this.model.toJSON()
			}));
			this.render_member_card_no();
			return this;
		},
		validate: function() {
			//验证模型数据
			return this.$form.validate().form();
		},
		on_change_room: function() {
			var changed_room = erp_instance.ktv_sale.ktv_room_point.get("all_rooms").get(this.$form.find('#room_id').val());
			this.room = changed_room;
			this.model.set({
				"room_id": changed_room.get("id")
			});

		},
		save: function() {
			var self = this;
			//保存数据
			if (!this.validate()) return false;
			this.model.set(this.$form.form2json());
			this.model.push().then(function(result) {
				//更新包厢状态
			});
		}
	});
	//包厢买断界面
	widget.RoomBuyoutWidget = erp_instance.web.OldWidget.extend({
		template_fct: qweb_template("room-buyout-template"),
		init: function(parent, options) {
			var self = this;
			this.room = options.room;
			this.model = new model.RoomBuyout();
			//会员信息
			this.member = new model.Member();
			//获取包厢费用信息
			this.room_fee_info = this.room.get_room_fee_info();
			this.ready = this.room_fee_info.ready;
            this.member.bind("change",this.render_member_card_no,this);
			this._super(parent, options);
		},
		render_element: function() {
			var self = this;
			this.$element.html(self.template_fct({
				"model": self.model.toJSON(),
				"room": self.room.toJSON(),
				"room_fee_info": self.room_fee_info.export_as_json(),
				"rooms": erp_instance.ktv_sale.ktv_room_point.get_rooms_by_state('free').toJSON()
			}));
			return this;
		},
        //重新显示会员信息
		render_member_card_no: function() {
			if (this.member.get("id")) {
				var member_card_no = this.member.get("member_card_no");
				var member_class = this.member.get("member_class_id");
				var member_name = this.member.get("name");
				var info = member_card_no + "[" + member_class[1] + "]" + "[" + member_name + "]" ;
				this.$element.find("#member_card_no").html(info);
			}
            else
				this.$element.find("#member_card_no").html(null);
		},

		start: function() {
			//隐藏其他元素
			$('#room_status').hide();
			$('#room_filter').hide();
			$('#room_list').hide();
            //设置当前选中的包厢
            this.$element.find("#room_id").val(this.room.id);
			//会员刷卡绑定
			this.$element.find('.btn-member-card-read').click(_.bind(this.read_member_card, this));
			this.$element.find('.btn-member-card-clear').click(_.bind(this.member_card_clear, this));
			this.$element.find('.btn-close-room-buyout').click(_.bind(this.close, this));
			//如果当前无可用买断,则确定按钮不可用
			if (this.room_fee_info.get_active_buyout_config_lines().length == 0) this.$element.find(".btn-confirm-room-buyout").addClass("disabled");
		},
		close: function() {
			$('#room_status').show();
			$('#room_filter').show();
			$('#room_list').show();
			this.stop();
		},
		//读取会员卡
		read_member_card: function() {
			var w = new widget.MemberCardReadWidget(null, {
				model: this.member
			});
		},
		member_card_clear: function() {
			this.$element.find('#member_card_no').attr("disabled", true);
			this.member.clear();
		}
	});

	//会员查询界面
	widget.MemberCardReadWidget = widget.BootstrapModal.extend({
		template_fct: qweb_template("member-card-read-template"),
		init: function(parent, options) {
			//传入界面的会员对象
			this.model = options.model;
			//当前查询到的会员信息
			this.searched_member = new model.Member();
            this.searched_member.bind("change",this._ok_close,this);
			this._super(parent, options);
		},
        post_open : function(){
            this.$element.find('#input_member_code').focus();
        },

		render_element: function() {
			this.$element.html(this.template_fct({"searched_member" : this.searched_member.toJSON()}));
			return this;
		},
		start: function() {
            this.$element.find('#btn_member_search').click(_.bind(this._search,this));
            this.$element.find('#btn_ok').click(_.bind(this._ok_close,this));
		},
        //确认关闭
        _ok_close : function(){
            if(this.searched_member.get("id"))
            {
                this.model.set(this.searched_member.attributes);
                this.close();
            }
        },
		//根据member_code查找member
		_search: function() {
			var self = this;
			var input_member_card_no = this.$element.find('#input_member_code').val();
			if (input_member_card_no != "") {
				model.fetch_by_osv_name('ktv.member', {
					"domain": [["member_card_no", '=', input_member_card_no]]
				}).pipe(function(result) {
					//未查到卡信息
					if (result.length == 0){
                        self.searched_member.clear();
                        self.$element.find(".alert").removeClass('hide');
                    }
					else{
                        self.$element.find(".alert").addClass('hide');
                        self.searched_member.set(result[0]);
                    }
				})
			}
            this.$element.find("#input_member_code").focus().select();
		}

	});
	//openerp的入口组件,用于定义系统的初始入口处理
	erp_instance.web.client_actions.add('ktv_room_pos.ui', 'erp_instance.ktv_sale.widget.MainRoomPointOfSale');
	widget.MainRoomPointOfSale = erp_instance.web.OldWidget.extend({
		init: function() {
			this._super.apply(this, arguments);
			if (erp_instance.ktv_sale.ktv_room_point) throw "ktv_room_point 已初始化.";
			erp_instance.ktv_sale.ktv_room_point = new erp_instance.ktv_sale.model.KtvRoomPoint();
		},
		start: function() {
			var self = this;
			return erp_instance.ktv_sale.ktv_room_point.ready.then(function() {
				self.render_element();
				erp_instance.ktv_sale.ktv_room_point.app = new erp_instance.ktv_sale.App(self.$element);
				self.$element.find(".btn-close").click(_.bind(self.stop, self));
				$('oe_toggle_secondary_menu').hide();
				$('#oe_secondary_menu').hide();
				$('.header').hide();
				$('.menu').hide();
				$('.oe_footer').hide();
			});
		},
		render: function() {
			return qweb_template("RoomPointOfSale")();
		},
		stop: function() {
			$('oe_toggle_secondary_menu').show();
			$('#oe_secondary_menu').show();
			$('.header').show();
			$('.menu').show();
			$('.oe_footer').show();
			erp_instance.ktv_sale.ktv_room_point = undefined;
			this._super();

		}
	});
};

