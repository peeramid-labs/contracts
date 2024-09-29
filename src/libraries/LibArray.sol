// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;
import "hardhat/console.sol";

library LibArray {
    /**
     * @dev Sorts the elements of the array in ascending order using the quicksort algorithm.
     *
     * Requirements:
     *
     * - The array to be sorted must not be empty.
     * - The starting and ending indices must be within the bounds of the array.
     *
     * Modifies:
     *
     * - The array is sorted in ascending order.
     *
     * Note:
     *
     * - This function uses the in-place quicksort algorithm, which has an average-case complexity of O(n log n) and a worst-case complexity of O(n^2).
     */
    function quickSort(uint256[] memory arr, int256 left, int256 right) internal view {
        int256 i = left;
        int256 j = right;
        if (i == j) return;
        uint256 pivot = arr[uint256(left + (right - left) / 2)];
        while (i <= j) {
            while (arr[uint256(i)] > pivot) ++i;
            while (pivot > arr[uint256(j)]) j--;
            if (i <= j) {
                (arr[uint256(i)], arr[uint256(j)]) = (arr[uint256(j)], arr[uint256(i)]);
                ++i;
                j--;
            }
        }
        if (left < j) quickSort(arr, left, j);
        if (i < right) quickSort(arr, i, right);
    }
}
