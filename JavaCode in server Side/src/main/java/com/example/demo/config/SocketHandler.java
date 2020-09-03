package com.example.demo.config;

import org.springframework.stereotype.Component;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;

@Component
public class SocketHandler extends TextWebSocketHandler {
    List<WebSocketSession> sessions = new CopyOnWriteArrayList<>();

    @Override
    protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
        super.handleTextMessage(session, message);
        for(WebSocketSession socketSession: sessions){
            if (socketSession.isOpen() && !session.getId().equals(socketSession.getId())){
                socketSession.sendMessage(message);
                System.out.println("------------->"+message.getPayload());
            }
        }
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) throws Exception {
       super.afterConnectionEstablished(session);
        sessions.add(session);
    }
}
