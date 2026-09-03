package com.wordlearena.leaderboard.service;

import com.wordlearena.leaderboard.dto.LeaderboardEntryResponse;
import com.wordlearena.leaderboard.dto.MyLeaderboardResponse;
import com.wordlearena.user.entity.User;
import com.wordlearena.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class LeaderboardService {

    private final UserRepository userRepository;

    public LeaderboardService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional(readOnly = true)
    public List<LeaderboardEntryResponse> getLeaderboard() {

        List<User> users =
                userRepository.findAllByOrderByRatingDescUsernameAsc();

        return users.stream()
                .map(user -> new LeaderboardEntryResponse(
                        users.indexOf(user) + 1,
                        user.getId(),
                        user.getUsername(),
                        user.getRating()
                ))
                .toList();
    }

    @Transactional(readOnly = true)
    public MyLeaderboardResponse getMyRank(User currentUser) {

        List<User> users =
                userRepository.findAllByOrderByRatingDescUsernameAsc();

        int rank = -1;

        for (int i = 0; i < users.size(); i++) {

            if (users.get(i).getId()
                    .equals(currentUser.getId())) {

                rank = i + 1;
                break;
            }
        }

        if (rank == -1) {
            throw new IllegalStateException(
                    "Authenticated user not found on leaderboard"
            );
        }

        return new MyLeaderboardResponse(
                rank,
                currentUser.getId(),
                currentUser.getUsername(),
                currentUser.getRating()
        );
    }
}