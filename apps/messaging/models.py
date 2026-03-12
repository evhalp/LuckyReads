from django.db import models

class Conversation(models.Model):
    name = models.CharField(max_length=32, blank=True, default='')
    participants = models.ManyToManyField(
        'users.User',
        through='ConversationMember',
        related_name='conversations'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messaging_conversation'

    def __str__(self):
        return self.name or f'Conversation #{self.pk}'
    
class ConversationMember(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='members'
    )
    user = models.ForeignKey(
        'users.User',
        on_delete=models.CASCADE,
        related_name='conversation_memberships'
    )
    joined_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messaging_conversation_member'
        constraints = [
            models.UniqueConstraint(
                fields=['conversation', 'user'],
                name='unique_conversation_member'
            )
        ]
    
    def __str__(self):
        return f'{self.user.username}: {self.conversation}'
    
class Message(models.Model):
    conversation = models.ForeignKey(
        Conversation,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    sender = models.ForeignKey(
        'users.User',
        on_delete=models.SET_NULL,
        null=True,
        related_name='sent_messages'
    )
    content = models.TextField()
    sent_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'messaging_message'
        ordering = ['sent_at']

        def __str__(self):
            name = self.sender.username if self.sender else '[DELETED]'
            return f'{name}: {self.content[:40]} ({self.sent_at:%Y-%m-%d %H:%M})'
