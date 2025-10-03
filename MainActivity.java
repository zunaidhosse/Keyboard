package com.example.chatapp;

import android.graphics.Rect;
import android.os.Bundle;
import android.os.Handler;
import android.text.Editable;
import android.text.TextWatcher;
import android.view.View;
import android.view.ViewTreeObserver;
import android.widget.EditText;
import android.widget.ImageButton;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;
import androidx.appcompat.app.AppCompatActivity;
import androidx.appcompat.widget.Toolbar;
import java.text.SimpleDateFormat;
import java.util.Date;
import java.util.Locale;

public class MainActivity extends AppCompatActivity {

    private ScrollView scrollView;
    private LinearLayout messagesContainer;
    private EditText messageInput;
    private ImageButton sendButton;
    private Handler handler = new Handler();
    private boolean isKeyboardVisible = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        // Initialize views
        Toolbar toolbar = findViewById(R.id.toolbar);
        setSupportActionBar(toolbar);

        scrollView = findViewById(R.id.scrollView);
        messagesContainer = findViewById(R.id.messagesContainer);
        messageInput = findViewById(R.id.messageInput);
        sendButton = findViewById(R.id.sendButton);

        // Setup keyboard visibility listener
        setupKeyboardListener(); 

        // Add some sample messages
        addSampleMessages();

        // Send button click listener
        sendButton.setOnClickListener(v -> sendMessage());

        // Send on Enter key
        messageInput.setOnEditorActionListener((v, actionId, event) -> {
            sendMessage();
            return true;
        });

        // Auto-scroll when typing
        messageInput.addTextChangedListener(new TextWatcher() {
            @Override
            public void beforeTextChanged(CharSequence s, int start, int count, int after) {}

            @Override
            public void onTextChanged(CharSequence s, int start, int before, int count) {
                if (isKeyboardVisible) {
                    scrollToBottom();
                }
            }

            @Override
            public void afterTextChanged(Editable s) {}
        });
    }

    private void setupKeyboardListener() {
        final View rootView = findViewById(android.R.id.content);

        rootView.getViewTreeObserver().addOnGlobalLayoutListener(new ViewTreeObserver.OnGlobalLayoutListener() {
            @Override
            public void onGlobalLayout() {
                Rect rect = new Rect();
                rootView.getWindowVisibleDisplayFrame(rect);

                int screenHeight = rootView.getRootView().getHeight();
                int keypadHeight = screenHeight - rect.bottom;

                if (keypadHeight > screenHeight * 0.15) {
                    // Keyboard is visible
                    if (!isKeyboardVisible) {
                        isKeyboardVisible = true;
                        onKeyboardShown();
                    }
                } else {
                    // Keyboard is hidden
                    if (isKeyboardVisible) {
                        isKeyboardVisible = false;
                        onKeyboardHidden();
                    }
                }
            }
        });
    }

    private void onKeyboardShown() {
        // Scroll to bottom with delay to ensure layout is complete
        handler.postDelayed(this::scrollToBottom, 100);
    }

    private void onKeyboardHidden() {
        // Optional: Handle keyboard hidden event
    }

    private void sendMessage() {
        String message = messageInput.getText().toString().trim();
        if (!message.isEmpty()) {
            addMessage(message, true);
            messageInput.setText("");

            // Simulate response after 1 second
            handler.postDelayed(() -> {
                addMessage("This is an auto-generated response!", false);
            }, 1000);
        }
    }

    private void addMessage(String message, boolean isSent) {
        View messageView = getLayoutInflater().inflate(R.layout.item_message, null);

        TextView messageText = messageView.findViewById(R.id.messageText);
        TextView timeText = messageView.findViewById(R.id.timeText);

        messageText.setText(message);
        timeText.setText(getCurrentTime());

        // Set alignment and colors
        LinearLayout.LayoutParams params = new LinearLayout.LayoutParams(
            LinearLayout.LayoutParams.WRAP_CONTENT,
            LinearLayout.LayoutParams.WRAP_CONTENT
        );

        if (isSent) {
            params.gravity = android.view.Gravity.END;
            messageView.findViewById(R.id.messageBubble).setBackgroundResource(R.drawable.bg_message_sent);
            messageText.setTextColor(getResources().getColor(android.R.color.white));
        } else {
            params.gravity = android.view.Gravity.START;
            messageView.findViewById(R.id.messageBubble).setBackgroundResource(R.drawable.bg_message_received);
            messageText.setTextColor(getResources().getColor(android.R.color.black));
        }

        params.setMargins(8, 8, 8, 8);
        messageView.findViewById(R.id.messageBubble).setLayoutParams(params);

        messagesContainer.addView(messageView);

        // Scroll to bottom
        scrollToBottom();
    }

    private void scrollToBottom() {
        handler.post(() -> {
            scrollView.fullScroll(View.FOCUS_DOWN);

            // Additional scroll if needed
            View lastChild = messagesContainer.getChildAt(messagesContainer.getChildCount() - 1);
            if (lastChild != null) {
                int bottom = lastChild.getBottom() + scrollView.getPaddingBottom();
                final int sy = scrollView.getScrollY();
                final int sh = scrollView.getHeight();
                final int delta = bottom - (sy + sh);

                if (delta > 0) {
                    scrollView.smoothScrollBy(0, delta);
                }
            }
        });
    }

    private String getCurrentTime() {
        return new SimpleDateFormat("HH:mm", Locale.getDefault()).format(new Date());
    }

    private void addSampleMessages() {
        addMessage("Hello! Welcome to the chat app.", false);
        addMessage("Type a message below and press send.", false);
        addMessage("The keyboard will automatically adjust the view.", false);
    }
}