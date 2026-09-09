package com.wordlearena.websocket.config;

import com.wordlearena.auth.service.CustomUserDetailsService;
import com.wordlearena.auth.service.JwtService;
import com.wordlearena.websocket.service.UserPresenceService;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.config.ChannelRegistration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.scheduling.concurrent.ThreadPoolTaskScheduler;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;
    private final ObjectProvider<UserPresenceService> presenceServiceProvider;

    public WebSocketConfig(
            JwtService jwtService,
            CustomUserDetailsService userDetailsService,
            ObjectProvider<UserPresenceService> presenceServiceProvider) {
        this.jwtService = jwtService;
        this.userDetailsService = userDetailsService;
        this.presenceServiceProvider = presenceServiceProvider;
    }

    @Override
    public void configureMessageBroker(MessageBrokerRegistry config) {
        ThreadPoolTaskScheduler taskScheduler = new ThreadPoolTaskScheduler();
        taskScheduler.setPoolSize(1);
        taskScheduler.setThreadNamePrefix("ws-heartbeat-");
        taskScheduler.initialize();

        // Enable in-memory broker with 10s ping/pong heartbeats to keep proxy/load-balancer sockets alive
        config.enableSimpleBroker("/topic", "/queue")
                .setTaskScheduler(taskScheduler)
                .setHeartbeatValue(new long[] {10000, 10000});

        config.setApplicationDestinationPrefixes("/app");
        config.setUserDestinationPrefix("/user");
    }

    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        // Pure WebSocket endpoint for standard clients (@stomp/stompjs)
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*");

        // SockJS fallback endpoint
        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns("*")
                .withSockJS();
    }

    @Override
    public void configureClientInboundChannel(ChannelRegistration registration) {
        registration.interceptors(new ChannelInterceptor() {
            @Override
            public Message<?> preSend(Message<?> message, MessageChannel channel) {
                StompHeaderAccessor accessor =
                        MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

                if (accessor != null && StompCommand.CONNECT.equals(accessor.getCommand())) {
                    String authHeader = accessor.getFirstNativeHeader("Authorization");
                    if (authHeader == null) {
                        authHeader = accessor.getFirstNativeHeader("token");
                    }

                    if (authHeader != null) {
                        String token = authHeader.startsWith("Bearer ")
                                ? authHeader.substring(7)
                                : authHeader;

                        if (jwtService.isTokenValid(token)) {
                            try {
                                String username = jwtService.extractUsername(token);
                                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                                UsernamePasswordAuthenticationToken authentication =
                                        new UsernamePasswordAuthenticationToken(
                                                userDetails,
                                                null,
                                                userDetails.getAuthorities()
                                        );
                                accessor.setUser(authentication);
                                String sessionId = accessor.getSessionId();
                                if (sessionId != null) {
                                    presenceServiceProvider.ifAvailable(service ->
                                            service.onUserConnected(username, sessionId)
                                    );
                                }
                            } catch (Exception ignored) {
                                // Invalid token / user lookup failed
                            }
                        }
                    }
                }

                return message;
            }
        });
    }
}
