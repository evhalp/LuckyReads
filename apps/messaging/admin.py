from django.contrib import admin
from .models import Conversation, ConversationMember, Message

@admin.register(Conversation)
class ConversationAdmin(admin.ModelAdmin):
    list_display = ('name', 'created_at')
    search_fields = ('name',)

@admin.register(ConversationMember)
class ConversationMemberAdmin(admin.ModelAdmin):
    list_display = ('user', 'conversation', 'joined_at')
    search_field = ('user__username', 'conversation__name')

@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('sender', 'conversation', 'sent_at', 'preview_content')
    search_fields = ('sender__username', 'content')

    @admin.display(description='Content')
    def preview_content(self, obj):
        return obj.content[:40]
