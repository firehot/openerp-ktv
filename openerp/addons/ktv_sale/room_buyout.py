# -*- coding: utf-8 -*-
import logging
from osv import fields, osv
import decimal_precision as dp
import ktv_helper

_logger = logging.getLogger(__name__)

#包厢买断信息
class room_buyout(osv.osv):
    _name="ktv.room_buyout"

    _columns = {
            "room_operate_id" : fields.many2one("ktv.room_operate","room_operate_id",select = True,readonly = True,visible = False,help="包厢操作对象"),
            "guest_name" : fields.char("guest_name",size = 20,help="客人姓名"),
            "persons_count" : fields.integer("persons_count",help="客人人数"),
            "buyout_config_id" : fields.many2one("ktv.buyout_config","buyout_config_id",required = True,select = True,help="买断名称"),
            "time_from" : fields.datetime("time_from",required = True,help="开房时间(此处指的是实际的开房时间)"),
            "time_to" : fields.datetime("time_to",required = True,help="关房时间"),
            "buyout_minutes" : fields.integer("buyout_minutes",help="买断时长"),
            "member_id" : fields.many2one("ktv.member","member_id",help="会员ID"),
            }

    _defaults = {
            "persons_count" : 2,
            "time_from" : fields.datetime.now
            }
    #buyout_config_id发生变化
    def _on_change_buyout_config_id(cr,uid,buyout_config_id):
        pass
